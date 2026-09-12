import * as v from 'valibot';

export const stringSchema = v.pipe(v.string(), v.minLength(1));
export const numberSchema = v.pipe(v.unknown(), v.transform(Number), v.number());
export const dateSchema = v.pipe(
  v.unknown(),
  v.transform((input) => new Date(input as string | number | Date)),
  v.date(),
);

type DateSchema = v.GenericSchema<unknown, Date>;

export const sortSchema = v.optional(v.picklist(['asc', 'desc']));

export type SortSchema = typeof sortSchema;
export type Sort = v.InferOutput<SortSchema>;

export type AnyObjectSchema =
  | v.ObjectSchema<v.ObjectEntries, v.ErrorMessage<v.ObjectIssue> | undefined>
  | v.StrictObjectSchema<v.ObjectEntries, v.ErrorMessage<v.StrictObjectIssue> | undefined>
  | v.LooseObjectSchema<v.ObjectEntries, v.ErrorMessage<v.LooseObjectIssue> | undefined>
  | v.ObjectWithRestSchema<v.ObjectEntries, v.GenericSchema, v.ErrorMessage<v.ObjectWithRestIssue> | undefined>;

const embeddedSchema = v.optional(v.looseObject({}));

export type EmbeddedSchema = v.OptionalSchema<AnyObjectSchema, undefined>;

const linkSchema = v.intersect([
  v.object({
    href: v.string(),
    name: v.optional(v.string()),
    templated: v.optional(v.boolean()),
  }),
  v.record(v.string(), v.unknown()),
]);

type LinkSchema = typeof linkSchema;

export type Link = v.InferOutput<LinkSchema>;

const linksSchema = v.optional(v.record(v.string(), v.union([linkSchema, v.array(linkSchema)])));

type LinksSchema = typeof linksSchema;

export type InputModelSchema = AnyObjectSchema;

export type InputModel<IMS extends InputModelSchema> = v.InferOutput<IMS>;

type ModelEntries<IMS extends InputModelSchema> = IMS['entries'] & {
  id: typeof stringSchema;
  createdAt: DateSchema;
  updatedAt: v.OptionalSchema<DateSchema, undefined>;
};

export type InputModelListSchema = AnyObjectSchema &
  v.GenericSchema<
    unknown,
    {
      offset: number;
      limit: number;
      filters: { [key: string]: unknown };
      sort: { [key: string]: Sort };
    }
  >;

export type InputModelList<IMLS extends InputModelListSchema> = v.InferOutput<IMLS>;

export type ModelSchema<IMS extends InputModelSchema> = v.StrictObjectSchema<ModelEntries<IMS>, undefined>;

export type Model<IMS extends InputModelSchema> = InputModel<IMS> & {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
};

export const createModelSchema = <IMS extends InputModelSchema>(inputModelSchema: IMS): ModelSchema<IMS> =>
  v.strictObject<ModelEntries<IMS>>({
    ...inputModelSchema.entries,
    id: stringSchema,
    createdAt: dateSchema,
    updatedAt: v.optional(dateSchema),
  });

type ModelListEntries<IMS extends InputModelSchema, IMLS extends InputModelListSchema> = IMLS['entries'] & {
  count: typeof numberSchema;
  items: v.ArraySchema<ModelSchema<IMS>, undefined>;
};

export type ModelListSchema<IMS extends InputModelSchema, IMLS extends InputModelListSchema> = v.StrictObjectSchema<
  ModelListEntries<IMS, IMLS>,
  undefined
>;

export type ModelList<IMS extends InputModelSchema, IMLS extends InputModelListSchema> = InputModelList<IMLS> & {
  count: number;
  items: Array<Model<IMS>>;
};

export const createModelListSchema = <IMS extends InputModelSchema, IMLS extends InputModelListSchema>(
  inputModelSchema: IMS,
  inputModelListSchema: IMLS,
): ModelListSchema<IMS, IMLS> =>
  v.strictObject<ModelListEntries<IMS, IMLS>>({
    ...inputModelListSchema.entries,
    count: numberSchema,
    items: v.array(createModelSchema(inputModelSchema)),
  });

type EnrichedModelEntries<
  IMS extends InputModelSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
> = ModelEntries<IMS> & {
  _embedded: EMS;
  _links: LinksSchema;
};

export type EnrichedModelSchema<
  IMS extends InputModelSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
> = v.StrictObjectSchema<EnrichedModelEntries<IMS, EMS>, undefined>;

export type EnrichedModel<IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema> = v.InferOutput<
  EnrichedModelSchema<IMS, EMS>
>;

export function createEnrichedModelSchema<IMS extends InputModelSchema>(
  inputModelSchema: IMS,
): EnrichedModelSchema<IMS>;
export function createEnrichedModelSchema<IMS extends InputModelSchema, EMS extends EmbeddedSchema>(
  inputModelSchema: IMS,
  embeddedModelSchema: EMS,
): EnrichedModelSchema<IMS, EMS>;
export function createEnrichedModelSchema<IMS extends InputModelSchema, EMS extends EmbeddedSchema>(
  inputModelSchema: IMS,
  embeddedModelSchema?: EMS,
): EnrichedModelSchema<IMS, EMS> {
  return v.strictObject<EnrichedModelEntries<IMS, EMS>>({
    ...createModelSchema(inputModelSchema).entries,
    _embedded: (embeddedModelSchema ?? embeddedSchema) as EMS,
    _links: linksSchema,
  });
}

type EnrichedModelListEntries<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
> = IMLS['entries'] & {
  count: typeof numberSchema;
  items: v.ArraySchema<EnrichedModelSchema<IMS, EMS>, undefined>;
  _embedded: EMLS;
  _links: LinksSchema;
};

export type EnrichedModelListSchema<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
> = v.StrictObjectSchema<EnrichedModelListEntries<IMS, IMLS, EMS, EMLS>, undefined>;

export type EnrichedModelList<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
> = v.InferOutput<EnrichedModelListSchema<IMS, IMLS, EMS, EMLS>>;

export function createEnrichedModelListSchema<IMS extends InputModelSchema, IMLS extends InputModelListSchema>(
  inputModelSchema: IMS,
  inputModelListSchema: IMLS,
): EnrichedModelListSchema<IMS, IMLS>;
export function createEnrichedModelListSchema<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
>(
  inputModelSchema: IMS,
  inputModelListSchema: IMLS,
  embeddedModelSchema: EMS,
  embeddedModelListSchema?: EMLS,
): EnrichedModelListSchema<IMS, IMLS, EMS, EMLS>;
export function createEnrichedModelListSchema<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema,
  EMLS extends EmbeddedSchema,
>(
  inputModelSchema: IMS,
  inputModelListSchema: IMLS,
  embeddedModelSchema?: EMS,
  embeddedModelListSchema?: EMLS,
): EnrichedModelListSchema<IMS, IMLS, EMS, EMLS> {
  return v.strictObject<EnrichedModelListEntries<IMS, IMLS, EMS, EMLS>>({
    ...inputModelListSchema.entries,
    count: numberSchema,
    items: v.array(createEnrichedModelSchema(inputModelSchema, (embeddedModelSchema ?? embeddedSchema) as EMS)),
    _embedded: (embeddedModelListSchema ?? embeddedSchema) as EMLS,
    _links: linksSchema,
  });
}

export type EnrichModel<IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema> = (
  model: Model<IMS>,
  context?: { [key: string]: unknown },
) => Promise<EnrichedModel<IMS, EMS>>;

export type EnrichModelList<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
> = (
  list: ModelList<IMS, IMLS>,
  context?: { [key: string]: unknown },
) => Promise<EnrichedModelList<IMS, IMLS, EMS, EMLS>>;
