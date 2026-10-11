import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  createDish,
  fetchDishById,
  updateDish,
  fetchCategories,
  uploadDishImage,
  type CreateDishInput,
  type UpdateDishInput,
} from '../../api/dishes';
import { ApiError } from '../../api/http';
import { useAuthStore, useIsAuthenticated } from '../../store/auth';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DEFAULT_LANGUAGE } from '../../lib/i18n';

/**
 * Esquema de validación del formulario de platos.
 *
 * Todos los campos son requeridos en el alta; en la edición se usan parcialmente
 * pero la validación aquí no lo refleja (se valida como si fuera alta). Eso es
 * intencionado: el servidor es quien decide qué se actualiza; el formulario solo
 * valida lo que el usuario teclea aquí.
 */
const createDishFormSchema = () =>
  z.object({
    categoryId: z.coerce.number().int().positive('Debes seleccionar una categoría'),
    price: z.coerce.number().positive('El precio debe ser mayor a 0'),
    nameEs: z.string().trim().min(1, 'Nombre en español requerido'),
    nameRu: z.string().trim().min(1, 'Nombre en ruso requerido'),
    nameEn: z.string().trim().min(1, 'Nombre en inglés requerido'),
    descEs: z.string().trim().min(1, 'Descripción en español requerida'),
    descRu: z.string().trim().min(1, 'Descripción en ruso requerida'),
    descEn: z.string().trim().min(1, 'Descripción en inglés requerida'),
    ingredientsEs: z.string().trim().min(1, 'Ingredientes en español requeridos'),
    ingredientsRu: z.string().trim().min(1, 'Ingredientes en ruso requeridos'),
    ingredientsEn: z.string().trim().min(1, 'Ingredientes en inglés requeridos'),
  });

type DishFormFields = z.infer<ReturnType<typeof createDishFormSchema>>;

const DishFormSkeleton = () => {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
          <div className="h-32 w-full rounded bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
};

type DishFormErrorProps = {
  message?: string;
};

const DishFormError = ({ message }: DishFormErrorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-2xl p-4">
      <p
        role="alert"
        className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
      >
        {message || t('admin.dishes.error')}
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => navigate('/menu')}
      >
        {t('nav.backToMenu')}
      </Button>
    </main>
  );
};

/**
 * Página de crear/actualizar platos.
 *
 * La ruta puede ser:
 * - `/admin/dishes/create` → crear nuevo plato
 * - `/admin/dishes/:id` → editar plato existente
 *
 * En ambos casos requiere admin.
 */
const DishForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id: idParam } = useParams<{ id?: string }>();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const isEditMode = idParam !== undefined && idParam !== 'create';
  const dishId = isEditMode ? parseInt(idParam, 10) : null;
  const isValidId = isEditMode && !Number.isNaN(dishId);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<
    'imageRequired' | 'imageInvalidType' | 'imageTooLarge' | null
  >(null);

  // Redirige si no es admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      void navigate('/menu', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const schema = useMemo(() => createDishFormSchema(), []);

  // Carga el plato si estamos en modo edición
  const {
    data: dishData,
    isLoading: isDishLoading,
    error: dishError,
  } = useQuery({
    queryKey: ['adminDishTranslations', dishId],
    queryFn: async () => {
      if (!isValidId || dishId === null) return null;
      const [spanish, russian, english] = await Promise.all([
        fetchDishById(dishId, 'es'),
        fetchDishById(dishId, 'ru'),
        fetchDishById(dishId, 'en'),
      ]);

      return {
        spanish: spanish.dish,
        russian: russian.dish,
        english: english.dish,
      };
    },
    enabled: isValidId && isEditMode,
  });

  // Carga las categorías
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ['categories', i18n.resolvedLanguage],
    queryFn: () =>
      fetchCategories(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE),
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DishFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: 0,
      price: 0,
      nameEs: '',
      nameRu: '',
      nameEn: '',
      descEs: '',
      descRu: '',
      descEn: '',
      ingredientsEs: '',
      ingredientsRu: '',
      ingredientsEn: '',
    },
  });

  // Pobla el formulario con los datos del plato si estamos editando
  useEffect(() => {
    if (isEditMode && dishData !== null && dishData !== undefined) {
      setValue('categoryId', dishData.spanish.category.id);
      setValue('price', dishData.spanish.price);
      setValue('nameEs', dishData.spanish.name);
      setValue('descEs', dishData.spanish.description);
      setValue('ingredientsEs', dishData.spanish.ingredients);
      setValue('nameRu', dishData.russian.name);
      setValue('descRu', dishData.russian.description);
      setValue('ingredientsRu', dishData.russian.ingredients);
      setValue('nameEn', dishData.english.name);
      setValue('descEn', dishData.english.description);
      setValue('ingredientsEn', dishData.english.ingredients);
    }
  }, [dishData, isEditMode, setValue]);

  const selectedImagePreview = useMemo(
    () => (selectedImage === null ? null : URL.createObjectURL(selectedImage)),
    [selectedImage],
  );
  useEffect(
    () => () => {
      if (selectedImagePreview !== null) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    },
    [selectedImagePreview],
  );
  const imagePreviewUrl =
    selectedImagePreview ?? dishData?.spanish.imageUrl ?? '';

  // Mutaciones para crear y actualizar
  const createMutation = useMutation({
    mutationFn: async (values: DishFormFields) => {
      if (selectedImage === null) throw new Error('Dish image is required');
      const uploadedImage = await uploadDishImage(selectedImage);
      const body: CreateDishInput = {
        categoryId: values.categoryId,
        imageUrl: uploadedImage.imageUrl,
        price: values.price,
        nameEs: values.nameEs,
        nameRu: values.nameRu,
        nameEn: values.nameEn,
        descEs: values.descEs,
        descRu: values.descRu,
        descEn: values.descEn,
        ingredientsEs: values.ingredientsEs,
        ingredientsRu: values.ingredientsRu,
        ingredientsEn: values.ingredientsEn,
      };
      return createDish(body, i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      void navigate(`/menu/${response.dish.id}`, { replace: true });
    },
    onError: (error) => {
      setError('root', {
        message:
          error instanceof ApiError
            ? t(`admin.dishes.errors.${error.code}`, {
                defaultValue: error.message,
              })
            : t('admin.dishes.errors.unknown'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: DishFormFields) => {
      if (!isValidId || dishId === null) throw new Error('Invalid dish ID');
      const uploadedImage =
        selectedImage === null ? null : await uploadDishImage(selectedImage);
      const body: UpdateDishInput = {
        categoryId: values.categoryId,
        ...(uploadedImage !== null && { imageUrl: uploadedImage.imageUrl }),
        price: values.price,
        nameEs: values.nameEs,
        nameRu: values.nameRu,
        nameEn: values.nameEn,
        descEs: values.descEs,
        descRu: values.descRu,
        descEn: values.descEn,
        ingredientsEs: values.ingredientsEs,
        ingredientsRu: values.ingredientsRu,
        ingredientsEn: values.ingredientsEn,
      };
      return updateDish(dishId, body, i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dish', dishId] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      void navigate(`/menu/${response.dish.id}`, { replace: true });
    },
    onError: (error) => {
      setError('root', {
        message:
          error instanceof ApiError
            ? t(`admin.dishes.errors.${error.code}`, {
                defaultValue: error.message,
              })
            : t('admin.dishes.errors.unknown'),
      });
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!isEditMode && selectedImage === null) {
      setImageError('imageRequired');
      return;
    }

    if (isEditMode) {
      await updateMutation.mutateAsync(values);
    } else {
      await createMutation.mutateAsync(values);
    }
  });

  // Validación: si editamos pero no cargó el plato, es error
  if (isEditMode && !isValidId) {
    return <DishFormError message={t('admin.dishes.invalidId')} />;
  }

  if (isEditMode && dishError) {
    return (
      <DishFormError
        message={
          dishError instanceof ApiError
            ? t('admin.dishes.notFound')
            : t('admin.dishes.errors.load')
        }
      />
    );
  }

  if (isEditMode && isDishLoading) {
    return <DishFormSkeleton />;
  }

  if (isCategoriesLoading) {
    return <DishFormSkeleton />;
  }

  const categories = categoriesData?.categories ?? [];

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-3xl font-bold">
        {isEditMode
          ? t('admin.dishes.editTitle')
          : t('admin.dishes.createTitle')}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.dishes.formTitle')}</CardTitle>
          <CardDescription>
            {isEditMode
              ? t('admin.dishes.editDescription')
              : t('admin.dishes.createDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errors.root?.message !== undefined && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <form
            onSubmit={(event) => void onSubmit(event)}
            className="flex flex-col gap-6"
          >
            {/* Categoría */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoryId">
                {t('admin.dishes.form.category')}
              </Label>
              <select
                id="categoryId"
                {...register('categoryId')}
                className="rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {t('admin.dishes.form.selectCategory')}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Imagen */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="image">
                {t('admin.dishes.form.image')}
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                aria-invalid={imageError !== null}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  if (file === null) {
                    setSelectedImage(null);
                    setImageError(null);
                    return;
                  }

                  if (
                    !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(
                      file.type,
                    )
                  ) {
                    setSelectedImage(null);
                    event.currentTarget.value = '';
                    setImageError('imageInvalidType');
                    return;
                  }

                  if (file.size > 5 * 1024 * 1024) {
                    setSelectedImage(null);
                    event.currentTarget.value = '';
                    setImageError('imageTooLarge');
                    return;
                  }

                  setSelectedImage(file);
                  setImageError(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.dishes.form.imageUploadHint')}
              </p>
              {imageError !== null && (
                <p className="text-sm text-destructive">
                  {t(`admin.dishes.errors.${imageError}`)}
                </p>
              )}
              {imagePreviewUrl && (
                <div className="mt-2 flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {t('admin.dishes.form.imagePreview')}
                    </p>
                    <img
                      src={imagePreviewUrl}
                      alt={t('admin.dishes.form.imagePreview')}
                      className="mt-2 h-32 w-32 rounded object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Precio */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">
                {t('admin.dishes.form.price')}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price')}
                aria-invalid={errors.price !== undefined}
              />
              {errors.price !== undefined && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            {/* Nombres multiidioma */}
            <fieldset className="border-t pt-4">
              <legend className="text-sm font-semibold">
                {t('admin.dishes.form.namesSection')}
              </legend>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nameEs">
                    {t('admin.dishes.form.nameEs')}
                  </Label>
                  <Input
                    id="nameEs"
                    {...register('nameEs')}
                    aria-invalid={errors.nameEs !== undefined}
                  />
                  {errors.nameEs !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.nameEs.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nameRu">
                    {t('admin.dishes.form.nameRu')}
                  </Label>
                  <Input
                    id="nameRu"
                    {...register('nameRu')}
                    aria-invalid={errors.nameRu !== undefined}
                  />
                  {errors.nameRu !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.nameRu.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nameEn">
                    {t('admin.dishes.form.nameEn')}
                  </Label>
                  <Input
                    id="nameEn"
                    {...register('nameEn')}
                    aria-invalid={errors.nameEn !== undefined}
                  />
                  {errors.nameEn !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.nameEn.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Descripciones multiidioma */}
            <fieldset className="border-t pt-4">
              <legend className="text-sm font-semibold">
                {t('admin.dishes.form.descriptionsSection')}
              </legend>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="descEs">
                    {t('admin.dishes.form.descEs')}
                  </Label>
                  <textarea
                    id="descEs"
                    rows={3}
                    {...register('descEs')}
                    className="rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={errors.descEs !== undefined}
                  />
                  {errors.descEs !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.descEs.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="descRu">
                    {t('admin.dishes.form.descRu')}
                  </Label>
                  <textarea
                    id="descRu"
                    rows={3}
                    {...register('descRu')}
                    className="rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={errors.descRu !== undefined}
                  />
                  {errors.descRu !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.descRu.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="descEn">
                    {t('admin.dishes.form.descEn')}
                  </Label>
                  <textarea
                    id="descEn"
                    rows={3}
                    {...register('descEn')}
                    className="rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={errors.descEn !== undefined}
                  />
                  {errors.descEn !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.descEn.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Ingredientes multiidioma */}
            <fieldset className="border-t pt-4">
              <legend className="text-sm font-semibold">
                {t('admin.dishes.form.ingredientsSection')}
              </legend>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ingredientsEs">
                    {t('admin.dishes.form.ingredientsEs')}
                  </Label>
                  <textarea
                    id="ingredientsEs"
                    rows={3}
                    {...register('ingredientsEs')}
                    className="rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={errors.ingredientsEs !== undefined}
                  />
                  {errors.ingredientsEs !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.ingredientsEs.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ingredientsRu">
                    {t('admin.dishes.form.ingredientsRu')}
                  </Label>
                  <textarea
                    id="ingredientsRu"
                    rows={3}
                    {...register('ingredientsRu')}
                    className="rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={errors.ingredientsRu !== undefined}
                  />
                  {errors.ingredientsRu !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.ingredientsRu.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ingredientsEn">
                    {t('admin.dishes.form.ingredientsEn')}
                  </Label>
                  <textarea
                    id="ingredientsEn"
                    rows={3}
                    {...register('ingredientsEn')}
                    className="rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={errors.ingredientsEn !== undefined}
                  />
                  {errors.ingredientsEn !== undefined && (
                    <p className="text-sm text-destructive">
                      {errors.ingredientsEn.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Botones */}
            <div className="flex gap-2 border-t pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting
                  ? t('admin.dishes.submitting')
                  : isEditMode
                    ? t('admin.dishes.update')
                    : t('admin.dishes.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/menu')}
              >
                {t('admin.dishes.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default DishForm;
