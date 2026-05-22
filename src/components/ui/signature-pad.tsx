'use client';

/**
 * SignaturePad
 * ─────────────────────────────────────────────────────────────────
 * Canvas-based freehand signature capture component.
 *
 * Modes:
 *  - Create mode (no `value` prop): shows blank canvas for drawing.
 *  - Edit mode (`value` prop provided): shows a preview <img> of the
 *    existing signature alongside a "Redraw" button.
 *
 * When "Redraw" is clicked the preview is hidden and the blank canvas
 * is activated. If the drawer is cancelled without drawing a new
 * signature, calling `reset()` (via the forwarded ref) restores the
 * original base64 value by calling `onChange(originalValue)`.
 *
 * Integrates with react-hook-form via Controller:
 *   <Controller
 *     name="engineer_signature"
 *     control={control}
 *     render={({ field }) => (
 *       <SignaturePad
 *         ref={sigRef}
 *         value={field.value}
 *         onChange={field.onChange}
 *       />
 *     )}
 *   />
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCcw, Pencil, Trash2 } from 'lucide-react';

export interface SignaturePadHandle {
    /** Restore the original value (call when drawer is cancelled after "Redraw"). */
    reset: () => void;
    /** Returns the current base64 PNG data URL from the canvas. */
    getValue: () => string;
}

export interface SignaturePadProps {
    /** Existing base64 PNG data URL (edit mode). */
    value?: string;
    /** Called with the new base64 string whenever the signature changes. */
    onChange?: (value: string) => void;
    /** Disables all interaction. */
    disabled?: boolean;
    className?: string;
}

const SignaturePad = React.forwardRef<SignaturePadHandle, SignaturePadProps>(
    ({ value, onChange, disabled = false, className }, ref) => {
        const canvasRef = React.useRef<HTMLCanvasElement>(null);

        // Whether the user has started a stroke on the canvas
        const [hasDrawn, setHasDrawn] = React.useState(false);
        // Whether we are in "redraw mode" (user clicked Redraw in edit mode)
        const [isRedrawMode, setIsRedrawMode] = React.useState(false);
        // The original value stored when "Redraw" is clicked so we can restore it
        const originalValueRef = React.useRef<string | undefined>(undefined);

        // Determine display mode:
        //  - showPreview: show the <img> preview (edit mode, not yet in redraw mode)
        //  - showCanvas: show the canvas for drawing
        const showPreview = !!value && !isRedrawMode;
        const showCanvas = !value || isRedrawMode;

        // ─── Canvas drawing helpers ───────────────────────────────────

        const getPos = (
            e: MouseEvent | TouchEvent,
            canvas: HTMLCanvasElement
        ): { x: number; y: number } => {
            const rect = canvas.getBoundingClientRect();
            if ('touches' in e) {
                const touch = e.touches[0];
                return {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top,
                };
            }
            return {
                x: (e as MouseEvent).clientX - rect.left,
                y: (e as MouseEvent).clientY - rect.top,
            };
        };

        const clearCanvas = React.useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasDrawn(false);
            onChange?.('');
        }, [onChange]);

        // ─── Notify parent with current canvas data ───────────────────

        const emitChange = React.useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dataUrl = canvas.toDataURL('image/png');
            onChange?.(dataUrl);
        }, [onChange]);

        // ─── Mouse / Touch event handlers ────────────────────────────

        React.useEffect(() => {
            if (!showCanvas) return;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Style the stroke
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            let drawing = false;

            const startDraw = (e: MouseEvent | TouchEvent) => {
                if (disabled) return;
                e.preventDefault();
                drawing = true;
                const { x, y } = getPos(e, canvas);
                ctx.beginPath();
                ctx.moveTo(x, y);
            };

            const draw = (e: MouseEvent | TouchEvent) => {
                if (!drawing || disabled) return;
                e.preventDefault();
                const { x, y } = getPos(e, canvas);
                ctx.lineTo(x, y);
                ctx.stroke();
                setHasDrawn(true);
            };

            const stopDraw = (e: MouseEvent | TouchEvent) => {
                if (!drawing) return;
                e.preventDefault();
                drawing = false;
                ctx.closePath();
                emitChange();
            };

            // Mouse events
            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDraw);
            canvas.addEventListener('mouseleave', stopDraw);

            // Touch events
            canvas.addEventListener('touchstart', startDraw, { passive: false });
            canvas.addEventListener('touchmove', draw, { passive: false });
            canvas.addEventListener('touchend', stopDraw);

            return () => {
                canvas.removeEventListener('mousedown', startDraw);
                canvas.removeEventListener('mousemove', draw);
                canvas.removeEventListener('mouseup', stopDraw);
                canvas.removeEventListener('mouseleave', stopDraw);
                canvas.removeEventListener('touchstart', startDraw);
                canvas.removeEventListener('touchmove', draw);
                canvas.removeEventListener('touchend', stopDraw);
            };
        }, [showCanvas, disabled, emitChange]);

        // ─── Resize canvas to match its CSS width ────────────────────

        React.useEffect(() => {
            if (!showCanvas) return;
            const canvas = canvasRef.current;
            if (!canvas) return;

            const resizeObserver = new ResizeObserver(() => {
                // Preserve existing drawing across resize
                const ctx = canvas.getContext('2d');
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                if (imageData) {
                    ctx?.putImageData(imageData, 0, 0);
                }
                // Re-apply stroke style after resize (context resets on resize)
                if (ctx) {
                    ctx.strokeStyle = '#1a1a1a';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
            });

            resizeObserver.observe(canvas);
            return () => resizeObserver.disconnect();
        }, [showCanvas]);

        // ─── Imperative handle ────────────────────────────────────────

        React.useImperativeHandle(ref, () => ({
            reset() {
                if (isRedrawMode && originalValueRef.current !== undefined) {
                    // Restore the original value
                    onChange?.(originalValueRef.current);
                    setIsRedrawMode(false);
                    setHasDrawn(false);
                    // Clear the canvas
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }
            },
            getValue() {
                if (showPreview && value) {
                    return value;
                }
                const canvas = canvasRef.current;
                if (!canvas) return '';
                return canvas.toDataURL('image/png');
            },
        }));

        // ─── Handlers ────────────────────────────────────────────────

        const handleRedraw = () => {
            // Store the original value so we can restore it on cancel
            originalValueRef.current = value;
            setIsRedrawMode(true);
            setHasDrawn(false);
            // Clear canvas when entering redraw mode
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
            // Notify parent that the value is now empty (canvas is blank)
            onChange?.('');
        };

        const handleCancelRedraw = () => {
            if (originalValueRef.current !== undefined) {
                onChange?.(originalValueRef.current);
            }
            setIsRedrawMode(false);
            setHasDrawn(false);
        };

        // ─── Render ───────────────────────────────────────────────────

        return (
            <div className={cn('flex flex-col gap-2', className)}>
                {/* Preview mode (edit mode, existing signature) */}
                {showPreview && (
                    <div className="flex flex-col gap-2">
                        <div
                            className={cn(
                                'w-full rounded-xl border border-input bg-gray-50/50 dark:bg-white/5 overflow-hidden',
                                'flex items-center justify-center',
                                'min-h-[120px]'
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={value}
                                alt="Existing signature"
                                className="max-h-[160px] max-w-full object-contain p-2"
                            />
                        </div>
                        {!disabled && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRedraw}
                                className="self-start gap-1.5"
                            >
                                <Pencil className="size-3.5" />
                                Redraw
                            </Button>
                        )}
                    </div>
                )}

                {/* Canvas drawing mode */}
                {showCanvas && (
                    <div className="flex flex-col gap-2">
                        <div
                            className={cn(
                                'relative w-full rounded-xl border border-input bg-white dark:bg-gray-950 overflow-hidden',
                                disabled && 'opacity-50 pointer-events-none'
                            )}
                            style={{ height: '200px' }}
                        >
                            <canvas
                                ref={canvasRef}
                                className={cn(
                                    'w-full h-full block',
                                    !disabled && 'cursor-crosshair'
                                )}
                                style={{ touchAction: 'none' }}
                            />
                            {/* Placeholder text when canvas is empty */}
                            {!hasDrawn && !disabled && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-sm text-muted-foreground select-none">
                                        Sign here
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {!disabled && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCanvas}
                                    className="gap-1.5"
                                >
                                    <Trash2 className="size-3.5" />
                                    Clear
                                </Button>
                            )}
                            {/* Cancel redraw — restore original value */}
                            {isRedrawMode && !disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelRedraw}
                                    className="gap-1.5 text-muted-foreground"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Use existing
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

SignaturePad.displayName = 'SignaturePad';

export { SignaturePad };
