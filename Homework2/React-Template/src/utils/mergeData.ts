import * as d3 from "d3";

export type MergedRow = {
  country: string;
  year: number;
  // fields from global_population_risk.csv
  population?: number | null;
  environmental_stress_score?: number | null;
  ozone_risk_score?: number | null;
  goods_supply_risk_score?: number | null;
  climate_vulnerability_index?: number | null;
  economic_resilience_score?: number | null;
  global_population_pressure_index?: number | null;
  // fields from population_goods_resources.csv
  food_demand_index?: number | null;
  water_consumption_per_capita?: number | null;
  energy_demand_index?: number | null;
  goods_import_export_ratio?: number | null;
  inflation_rate?: number | null;
  supply_chain_disruption_index?: number | null;
  resource_dependency_score?: number | null;
  // fields from population_growth.csv
  population_growth_rate?: number | null;
  fertility_rate?: number | null;
  median_age?: number | null;
  urban_population?: number | null;
  population_density?: number | null;
  continent?: string | null;
  income_group?: string | null;
  // fields from population_ozone_environment.csv
  co2_emissions?: number | null;
  cfc_consumption?: number | null;
  ozone_thickness?: number | null;
  uv_radiation_index?: number | null;
  industrialization_index?: number | null;
  energy_consumption_per_capita?: number | null;
  policy_score?: number | null;
  // plus any other raw fields preserved as string...
};

function parseNumber(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9eE\.\-]+/g, ""));
  return isNaN(n) ? null : n;
}

function readCsv(path: string) {
  return d3.csv(path);
}

/*
 Merge strategy (client-side):
 - Load all four CSVs
 - Normalize year to number, country to trimmed string
 - Merge outer by key country + year (keep union of columns)
 - For population duplicates, prefer non-null values in this order:
   global_population_risk -> population_goods_resources -> population_growth -> population_ozone_environment
*/
export async function loadAndMergeData(): Promise<MergedRow[]> {
  const [
    gp, // global_population_risk.csv
    pgr, // population_goods_resources.csv
    pg, // population_growth.csv
    poe, // population_ozone_environment.csv
  ] = await Promise.all([
    readCsv("/global_population_risk.csv"),
    readCsv("/population_goods_resources.csv"),
    readCsv("/population_growth.csv"),
    readCsv("/population_ozone_environment.csv"),
  ]);

  const map = new Map<string, any>();

  function keyFor(country: string, year: number | string) {
    return `${(country || "").trim().toLowerCase()}::${String(year)}`;
  }

  // helper to upsert rows from a csv
  function ingest(rows: any[], prefix?: string) {
    rows.forEach((r) => {
      const country = (r.country || "").trim();
      const year = parseNumber(r.year) ?? null;
      if (!country || year === null) return;
      const key = keyFor(country, year);
      const entry = map.get(key) || { country, year: Number(year) };
      Object.keys(r).forEach((col) => {
        if (col.toLowerCase() === "country" || col.toLowerCase() === "year") return;
        const val = r[col];
        // parse numeric fields heuristically
        const parsed = parseNumber(val);
        entry[col] = parsed === null ? (val === "" ? null : val) : parsed;
      });
      map.set(key, entry);
    });
  }

  ingest(gp);
  ingest(pgr);
  ingest(pg);
  ingest(poe);

  // Post-process: canonicalize field names expected by components (try to pick common names)
  const out: MergedRow[] = [];
  for (const v of map.values()) {
    const row: any = {
      country: v.country,
      year: Number(v.year),
    };
    // population preference order
    row.population =
      v.population ??
      v.population_pgr ??
      v.population_pg ??
      v.population_poe ??
      v["Population"] ??
      v["population.1"] ??
      null;

    // copy known fields with best-effort mapping
    [
      "environmental_stress_score",
      "ozone_risk_score",
      "goods_supply_risk_score",
      "climate_vulnerability_index",
      "economic_resilience_score",
      "global_population_pressure_index",
      "food_demand_index",
      "water_consumption_per_capita",
      "energy_demand_index",
      "goods_import_export_ratio",
      "inflation_rate",
      "supply_chain_disruption_index",
      "resource_dependency_score",
      "population_growth_rate",
      "fertility_rate",
      "median_age",
      "urban_population",
      "population_density",
      "continent",
      "income_group",
      "co2_emissions",
      "cfc_consumption",
      "ozone_thickness",
      "uv_radiation_index",
      "industrialization_index",
      "energy_consumption_per_capita",
      "policy_score",
    ].forEach((k) => {
      // pick key options (exact match or variants)
      row[k] = v[k] ?? v[k + "_pgr"] ?? v[k + "_pg"] ?? v[k + "_poe"] ?? (v[k] === undefined ? null : v[k]);
    });

    out.push(row as MergedRow);
  }

  return out;
}