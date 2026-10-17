import { z } from 'zod';
import { dateOnlySchema } from './common.js';

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const reportRangeFields = {
  startDate: dateOnlySchema.optional(),
  endDate: dateOnlySchema.optional(),
  startDateTime: isoDateTimeSchema.optional(),
  endDateTime: isoDateTimeSchema.optional(),
};

export const reportDateQuerySchema = z
  .object(reportRangeFields)
  .strict()
  .refine(
    (q) =>
      !q.startDate ||
      !q.endDate ||
      q.startDate <= q.endDate,
    { message: 'startDate deve ser <= endDate' },
  )
  .refine(
    (q) =>
      !q.startDateTime ||
      !q.endDateTime ||
      q.startDateTime <= q.endDateTime,
    { message: 'startDateTime deve ser <= endDateTime' },
  );

export const revenueQuerySchema = reportDateQuerySchema.refine(
  (q) =>
    (q.startDate !== undefined && q.endDate !== undefined) ||
    (q.startDateTime !== undefined && q.endDateTime !== undefined),
  {
    message: 'Informe startDate/endDate ou startDateTime/endDateTime',
  },
);

export const topProductsQuerySchema = reportDateQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type ReportRangeQuery = z.infer<typeof reportDateQuerySchema>;
