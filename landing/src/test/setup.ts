import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals are off, so RTL's automatic afterEach cleanup never registers
afterEach(cleanup);
