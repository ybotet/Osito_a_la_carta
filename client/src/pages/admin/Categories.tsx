import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiError } from '../../api/http';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CreateCategoryInput,
} from '../../api/categories';
import { fetchCategories } from '../../api/dishes';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuthStore, useIsAuthenticated } from '../../store/auth';

type CategoryFormFields = CreateCategoryInput;

type AdminCategory = {
  id: number;
  slug: string;
  nameEs: string;
  nameRu: string;
  nameEn: string;
};

const Categories = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        slug: z
          .string()
          .trim()
          .min(2, 'slugLength')
          .max(50, 'slugLength')
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugFormat'),
        nameEs: z.string().trim().min(1, 'nameRequired'),
        nameRu: z.string().trim().min(1, 'nameRequired'),
        nameEn: z.string().trim().min(1, 'nameRequired'),
      }),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormFields>({
    resolver: zodResolver(schema),
    defaultValues: { slug: '', nameEs: '', nameRu: '', nameEn: '' },
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      void navigate('/menu', { replace: true });
    }
  }, [isAuthenticated, user?.role, navigate]);

  const categoriesQuery = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const [spanish, russian, english] = await Promise.all([
        fetchCategories('es', undefined, { silent: true }),
        fetchCategories('ru', undefined, { silent: true }),
        fetchCategories('en', undefined, { silent: true }),
      ]);
      const translations = new Map(
        russian.categories.map((category) => [category.id, category.name]),
      );
      const englishTranslations = new Map(
        english.categories.map((category) => [category.id, category.name]),
      );

      return spanish.categories.map((category): AdminCategory => {
        const nameRu = translations.get(category.id);
        const nameEn = englishTranslations.get(category.id);

        if (nameRu === undefined || nameEn === undefined) {
          throw new Error('Category translations are incomplete');
        }

        return {
          id: category.id,
          slug: category.slug,
          nameEs: category.name,
          nameRu,
          nameEn,
        };
      });
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const saveCategory = useMutation({
    mutationFn: ({ id, values }: { id: number | null; values: CategoryFormFields }) =>
      id === null
        ? createCategory(values, { silent: true })
        : updateCategory(id, values, { silent: true }),
    onSuccess: async () => {
      setMutationError(null);
      setEditingId(null);
      reset({ slug: '', nameEs: '', nameRu: '', nameEn: '' });
      await queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['dishes'] });
    },
    onError: (error) => {
      setMutationError(
        error instanceof ApiError
          ? t(`admin.categories.errors.${error.code}`, {
              defaultValue: t('admin.categories.errors.unknown'),
            })
          : t('admin.categories.errors.unknown'),
      );
    },
  });

  const removeCategory = useMutation({
    mutationFn: (id: number) => deleteCategory(id, { silent: true }),
    onSuccess: async (_data, deletedId) => {
      setMutationError(null);
      if (editingId === deletedId) {
        setEditingId(null);
        reset({ slug: '', nameEs: '', nameRu: '', nameEn: '' });
      }
      await queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['dishes'] });
    },
    onError: (error) => {
      setMutationError(
        error instanceof ApiError
          ? t(`admin.categories.errors.${error.code}`, {
              defaultValue: t('admin.categories.errors.unknown'),
            })
          : t('admin.categories.errors.unknown'),
      );
    },
  });

  const beginEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setMutationError(null);
    setValue('slug', category.slug);
    setValue('nameEs', category.nameEs);
    setValue('nameRu', category.nameRu);
    setValue('nameEn', category.nameEn);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMutationError(null);
    reset({ slug: '', nameEs: '', nameRu: '', nameEn: '' });
  };

  const onSubmit = handleSubmit(async (values) => {
    await saveCategory.mutateAsync({ id: editingId, values });
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const categories = categoriesQuery.data ?? [];
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4">
      <h1 className="text-3xl font-bold">{t('admin.categories.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingId === null
              ? t('admin.categories.createTitle')
              : t('admin.categories.editTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mutationError !== null && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {mutationError}
            </p>
          )}
          <form
            onSubmit={(event) => void onSubmit(event)}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-slug">{t('admin.categories.slug')}</Label>
              <Input id="category-slug" {...register('slug')} aria-invalid={Boolean(errors.slug)} />
              {errors.slug?.message && (
                <p className="text-sm text-destructive">
                  {t(`admin.categories.validation.${errors.slug.message}`)}
                </p>
              )}
            </div>
            {(['nameEs', 'nameRu', 'nameEn'] as const).map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <Label htmlFor={field}>
                  {t(`admin.categories.${field}`)}
                </Label>
                <Input id={field} {...register(field)} aria-invalid={Boolean(errors[field])} />
                {errors[field]?.message && (
                  <p className="text-sm text-destructive">
                    {t(`admin.categories.validation.${errors[field]?.message}`)}
                  </p>
                )}
              </div>
            ))}
            <div className="flex gap-2 md:col-span-2">
              <Button
                type="submit"
                disabled={isSubmitting || saveCategory.isPending}
              >
                {editingId === null
                  ? t('admin.categories.create')
                  : t('admin.categories.save')}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  {t('admin.categories.cancel')}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.categories.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesQuery.isPending ? (
            <p role="status">{t('admin.categories.loading')}</p>
          ) : categoriesQuery.isError ? (
            <div className="space-y-3">
              <p role="alert" className="text-destructive">
                {t('admin.categories.loadError')}
              </p>
              <Button variant="outline" onClick={() => void categoriesQuery.refetch()}>
                {t('admin.categories.retry')}
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground">{t('admin.categories.empty')}</p>
          ) : (
            <ul className="divide-y">
              {categories.map((category) => {
                const displayName =
                  activeLanguage === 'ru'
                    ? category.nameRu
                    : activeLanguage === 'en'
                      ? category.nameEn
                      : category.nameEs;

                return (
                  <li
                    key={category.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="font-medium">{displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.slug}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => beginEdit(category)}
                      >
                        {t('admin.categories.edit')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={removeCategory.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              t('admin.categories.confirmDelete', {
                                name: displayName,
                              }),
                            )
                          ) {
                            setMutationError(null);
                            removeCategory.mutate(category.id);
                          }
                        }}
                      >
                        {t('admin.categories.delete')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Categories;
