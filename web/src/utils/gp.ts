/** GP (Gross Profit) calculation helpers */

/** ราคาขายหลังคำนวณ GP = (amount * gp%) + amount */
export function calcPercentage(price: number, gpPercentage: number): number {
  return Number(((price * (gpPercentage / 100))).toPrecision(2));
}

/** ต้นทุนหลังคำนวณ GP = price + (price * (gp% / 100)) */
export function calcGrandPercentage(price: number, gpPercentage: number): number {
  return Math.round((price * (1 + gpPercentage / 100)));
}
