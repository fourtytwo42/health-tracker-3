/* ------------------------------------------------------------------
   Unit‑conversion helpers
   ----------------------------------------------------------------- */

   export const G_IN_LB = 453.592;
   export const G_IN_OZ = 28.35;
   export const ML_IN_CUP = 240;
   export const EGG_WEIGHT_G = 50;
   
   /* -------- nice fractional cups ---------- */
   const CUP_FRACS = [
     { v: 0.125, s: '⅛' },
     { v: 0.25,  s: '¼' },
     { v: 0.333, s: '⅓' },
     { v: 0.5,   s: '½' },
     { v: 0.667, s: '⅔' },
     { v: 0.75,  s: '¾' },
   ];
   
   const toNiceFraction = (cups: number): string => {
     const whole = Math.floor(cups);
     const frac  = cups - whole;
   
     let best = CUP_FRACS[0];
     let diff = Math.abs(frac - best.v);
     for (const f of CUP_FRACS) {
       const d = Math.abs(frac - f.v);
       if (d < diff) { best = f; diff = d; }
     }
   
     const parts = [];
     if (whole) parts.push(whole.toString());
     if (best.s) parts.push(best.s);
     return `${parts.join(' ')} cup${cups >= 1.5 ? 's' : ''}`.trim();
   };
   
   /* -------- main formatter ---------- */
   export const formatIngredientAmount = (
     amount: number,
     unit: string,
     ingredientName: string,
     useMetricUnits = false,
   ): string => {
     const u = unit.toLowerCase();
     const name = ingredientName.toLowerCase();
   
     /* ---------- metric passthrough ---------- */
     if (useMetricUnits) {
       if (u === 'g' || u === 'gram')
         return amount >= 1000
           ? `${Math.round((amount / 1000) * 10) / 10} kg`
           : `${Math.round(amount)} g`;
       if (u === 'ml' || u === 'milliliter')
         return amount >= 1000
           ? `${Math.round((amount / 1000) * 10) / 10} L`
           : `${Math.round(amount)} ml`;
       return `${Math.round(amount)} ${unit}`;
     }
   
     /* ---------- eggs (by count or weight) ---------- */
     if (name.includes('egg')) {
       if (u.includes('egg') || u === 'count' || u === '') {
         const n = Math.round(amount);
         return `${n} egg${n !== 1 ? 's' : ''}`;
       }
       const g = u === 'g' || u === 'gram'
           ? amount
           : (u === 'oz' || u === 'ounce') ? amount * G_IN_OZ : 0;
       if (g) {
         const n = Math.max(1, Math.round(g / EGG_WEIGHT_G));
         return `${n} egg${n !== 1 ? 's' : ''}`;
       }
     }
   
     /* ---------- spice pinch rule ---------- */
     if ((u === 'g' || u === 'gram') && amount <= 2) return 'pinch';
   
     /* ---------- meat always lb/oz ---------- */
     const MEAT_RE = /(chicken|beef|pork|turkey|lamb|steak|sirloin|bacon|ham)/i;
     const isMeat = MEAT_RE.test(name);
   
     /* ---------- grams handling ---------- */
     if (u === 'g' || u === 'gram') {
       if (isMeat) {
         // Meat: show as lb/oz
         const lbs = Math.floor(amount / G_IN_LB);
         const oz  = Math.round((amount - lbs * G_IN_LB) / G_IN_OZ);
         return `${lbs ? `${lbs} lb${lbs !== 1 ? 's' : ''} ` : ''}${oz} oz`.trim();
       }
   
       if (amount < 5)    return `${Math.round(amount / 5)} tsp`;   // 3‑4 g
       if (amount < 15)   return `${Math.round(amount / 5)} tsp`;   // 5‑14 g
       if (amount < 60)   return `${Math.round(amount / 15)} tbsp`; // 15‑59 g (up to ~4 tbsp)
       if (amount < 120)  return toNiceFraction(amount / 120);      // 60‑119 g (1/4 cup to ~1 cup)
   
       // 120 g baseline cup (typical flour density)
       return toNiceFraction(amount / 120);
     }
   
     /* ---------- millilitres handling ---------- */
     if (u === 'ml' || u === 'milliliter') {
       if (amount >= 60) return toNiceFraction(amount / ML_IN_CUP);
       if (amount >= 15) return `${Math.round(amount / 15)} tbsp`;
       if (amount >= 5)  return `${Math.round(amount / 5)} tsp`;
       return `${Math.round(amount)} ml`;
     }
   
     /* ---------- fallback ---------- */
     return `${Math.round(amount)} ${unit}`;
   };
   
   /* ------------------------------------------------------------------
      Height / weight helpers
      ----------------------------------------------------------------- */
   
   export const convertHeightToMetric = (ft: number, inches: number): number =>
     (ft * 12 + inches) * 2.54;
   
   export const convertHeightToAmerican = (
     cm: number,
   ): { feet: number; inches: number } => {
     const totalIn = cm / 2.54;
     return { feet: Math.floor(totalIn / 12), inches: Math.round(totalIn % 12) };
   };
   
   export const convertWeightToMetric = (lbs: number): number => lbs * 0.453592;
   export const convertWeightToAmerican = (kg: number): number => kg * 2.20462;
   
   /* ---------- BMI helpers ---------- */
   export const calculateBMI = (weightKg: number, heightCm: number): number => {
     const h = heightCm / 100;
     return weightKg / (h * h);
   };
   
   export const getBMICategory = (bmi: number): string =>
     bmi < 18.5 ? 'UNDERWEIGHT'
     : bmi < 25  ? 'NORMAL'
     : bmi < 30  ? 'OVERWEIGHT'
                 : 'OBESE';

