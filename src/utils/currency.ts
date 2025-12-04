import { supabase } from "../supabase";

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number | null> {
  if (!supabase) return null;
  if (fromCurrency === toCurrency) return amount;
  const { data, error } = await supabase.rpc("rpc_convert_price", { amount, from_currency: fromCurrency, to_currency: toCurrency });
  if (error) return null;
  return data as number | null;
}

