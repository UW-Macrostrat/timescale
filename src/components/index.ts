import h from "../hyper";
import { useRef, useEffect, useState } from "react";
import { Interval, NestedInterval, TimescaleOrientation } from "../types";
import { useTimescale } from "../provider";
import { SizeAwareLabel } from "@macrostrat/column-components";

type SizeState = {
  label: number;
  container: number;
};

function IntervalBox(props: { interval: Interval; showLabel?: boolean }) {
  const { interval: d, showLabel = true } = props;

  const [labelText, setLabelText] = useState<string>(d.nam);

  return h(SizeAwareLabel, {
    key: d.oid,
    style: { backgroundColor: d.col },
    className: "interval-box",
    labelClassName: "interval-label",
    label: labelText,
    onVisibilityChanged(viz) {
      if (!viz && labelText.length > 1) {
        setLabelText(labelText[0]);
      }
    },
  });
}

function IntervalChildren({ children }) {
  if (children == null || children.length == 0) return null;
  return h(
    "div.children",
    children.map((d) => {
      return h(TimescaleBoxes, { interval: d });
    })
  );
}

function ensureIncreasingAgeRange(ageRange) {
  return [Math.min(...ageRange), Math.max(...ageRange)];
}

function TimescaleBoxes(props: { interval: NestedInterval }) {
  const { interval } = props;
  const { scale, orientation, levels, ageRange } = useTimescale();
  const { eag, lag, lvl } = interval;

  // If we don't have an ageRange and scale, we don't specify the length.
  let length = null;

  // This age range extends further than any realistic constraints
  const expandedAgeRange = ensureIncreasingAgeRange(ageRange) ?? [-50, 5000];

  // If we have a scale, give us the boundaries clipped to the age range if appropriate
  if (scale != null) {
    const startAge = Math.min(expandedAgeRange[1], eag);
    const endAge = Math.max(expandedAgeRange[0], lag);
    length = Math.abs(scale(startAge) - scale(endAge));
  }

  let style = {};
  if (orientation == TimescaleOrientation.HORIZONTAL) {
    style["width"] = length;
  } else {
    style["height"] = length;
  }

  const [minLevel, maxLevel] = levels ?? [0, 5];

  const { children, nam: name } = interval;

  // Don't render if we are fully outside the age range of interest
  if (eag < expandedAgeRange[0]) return null;
  if (lag > expandedAgeRange[1]) return null;

  return h("div.interval", { className: name, style }, [
    h.if(lvl >= minLevel)(IntervalBox, { interval }),
    h.if(lvl < maxLevel)(IntervalChildren, { children }),
  ]);
}

export { TimescaleBoxes };
export * from "./cursor";
