import { redirect } from 'next/navigation';

export default function ExpenseIndexPage() {
  redirect('/expense/expenses');
}
