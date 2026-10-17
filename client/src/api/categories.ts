import { apiRequest } from './client';

export type CreateCategoryInput = {
  slug: string;
  nameEs: string;
  nameRu: string;
  nameEn: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CategoryMutationResponse = {
  language: string;
  category: {
    id: number;
    slug: string;
    name: string;
  };
};

export const createCategory = async (
  body: CreateCategoryInput,
  options?: { silent?: boolean },
): Promise<CategoryMutationResponse> =>
  (await apiRequest('/api/categories', {
    method: 'POST',
    body,
    silent: options?.silent,
  })) as CategoryMutationResponse;

export const updateCategory = async (
  id: number,
  body: UpdateCategoryInput,
  options?: { silent?: boolean },
): Promise<CategoryMutationResponse> =>
  (await apiRequest(`/api/categories/${id}`, {
    method: 'PUT',
    body,
    silent: options?.silent,
  })) as CategoryMutationResponse;

export const deleteCategory = async (
  id: number,
  options?: { silent?: boolean },
): Promise<void> => {
  await apiRequest(`/api/categories/${id}`, {
    method: 'DELETE',
    silent: options?.silent,
  });
};
