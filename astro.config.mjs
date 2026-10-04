// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

export default defineConfig({
  site: "https://www.ponchobase.com",
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  // Keep whitespace between inline elements (compression would glue words like "or Mobile" together).
  compressHTML: false,
  integrations: [
    sitemap({ filter: (page) => !page.includes("/404") }),
    icon({ include: { "fa6-solid": ["*"], "fa6-regular": ["*"] } }),
  ],
  build: {
    inlineStylesheets: "auto",
  },
});
