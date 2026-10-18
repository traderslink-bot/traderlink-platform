"use client";
import {useCoachingResourceNavigation} from "../communities/coaching-resource-context";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { usePathname, useSearchParams } from "next/navigation";

import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";

export function TradeAnalysisRangeAndBasisControls({
  dateRange,
  moneyBasis,
}: {
  dateRange: OverviewDateRange;
  moneyBasis: "gross" | "net";
}) {
  const nativePathname = usePathname();
  const resource=useCoachingResourceNavigation();
  const pathname=resource?.pathname??nativePathname;
  const nativeSearchParams = useSearchParams();
  const searchParams=resource?new URLSearchParams(resource.parameters):nativeSearchParams;

  function basisHref(basis: "gross" | "net"): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("basis", basis);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  return <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={1.5}
    sx={{ alignItems: { md: "center" }, justifyContent: "flex-end", ml: { md: "auto" } }}
  >
    <OverviewDateRangeControl href={pathname} showCaption={false} value={dateRange} />
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
      {(["gross", "net"] as const).map((basis) => <Button
        href={basisHref(basis)}
        key={basis}
        size="small"
        variant={basis === moneyBasis ? "contained" : "outlined"}
      >
        {basis === "gross" ? "Gross" : "Net"}
      </Button>)}
    </Stack>
  </Stack>;
}
