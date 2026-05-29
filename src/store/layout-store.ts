import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LayoutType = 'navbar' | 'sidebar';

interface LayoutState {
  layoutType: LayoutType;
  setLayoutType: (type: LayoutType) => void;
  toggleLayoutType: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layoutType: 'navbar',
      setLayoutType: (layoutType) => set({ layoutType }),
      toggleLayoutType: () =>
        set((state) => ({
          layoutType: state.layoutType === 'navbar' ? 'sidebar' : 'navbar',
        })),
    }),
    {
      name: 'layout-preference',
    }
  )
);
