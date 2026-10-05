import type { OpenSlideConfig } from '@open-slide/core';

const openSlideConfig: OpenSlideConfig = {
  // GitLab Pages may serve the site under a sub-path (e.g. /designer-day-2026/).
  // CI passes it in via OPEN_SLIDE_BASE; locally this stays '/'.
  base: process.env.OPEN_SLIDE_BASE || '/',
};

export default openSlideConfig;
