"use server";

import { revalidatePath } from "next/cache";
import { closePeriod, reopenPeriod } from "@/lib/queries";
import type { Period } from "@/lib/period";

export async function closePeriodAction(contractId: number, period: Period): Promise<void> {
  await closePeriod(contractId, period);
  revalidatePath("/periodos");
  revalidatePath("/");
}

export async function reopenPeriodAction(contractId: number, period: Period): Promise<void> {
  await reopenPeriod(contractId, period);
  revalidatePath("/periodos");
  revalidatePath("/");
}
