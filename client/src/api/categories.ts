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
): Promise<CategoryMutationResponse> =>
  (await apiRequest('/api/categories', {
    method: 'POST',
    body,
  })) as CategoryMutationResponse;

export const updateCategory = async (
  id: number,
  body: UpdateCategoryInput,
): Promise<CategoryMutationResponse> =>
  (await apiRequest(`/api/categories/${id}`, {
    method: 'PUT',
    body,
  })) as CategoryMutationResponse;

export const deleteCategory = async (id: number): Promise<void> => {
  await apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
};
