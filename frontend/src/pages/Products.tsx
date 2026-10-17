import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useListQueryParams } from '../hooks/useListQueryParams';
import { Skeleton } from '../components/Skeleton';
import { Pagination } from '../components/Pagination';
import { SortableTh, toggleSort } from '../components/SortableTh';
import { Modal } from '../components/Modal';
import {
  PRODUCT_CATEGORIES,
  productCategoryLabel,
} from '../lib/labels';
import type { ProductDto as Product } from '../types/api';

type ProductForm = {
  name: string;
  description: string;
  price: number;
  category: (typeof PRODUCT_CATEGORIES)[number];
  preparationTime: number;
  isAvailable: boolean;
  imageUrl: string;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: 10,
  category: 'meal',
  preparationTime: 15,
  isAvailable: true,
  imageUrl: '',
};

const PAGE_SIZE = 20;

const LIST_DEFAULTS = {
  search: '',
  category: '',
  availability: '',
  minPrice: '',
  maxPrice: '',
  page: '1',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

type ProductSortBy =
  | 'name'
  | 'price'
  | 'createdAt'
  | 'category'
  | 'preparationTime'
  | 'isAvailable';

export function ProductsPage() {
  const { isAdmin } = useAuth();
  const { values, setParam, setMany } = useListQueryParams(LIST_DEFAULTS);
  const debouncedSearch = useDebouncedValue(values.search, 300);
  const page = Number(values.page) || 1;
  const sortBy = values.sortBy as ProductSortBy;
  const sortOrder = values.sortOrder as 'asc' | 'desc';

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [
      'products',
      debouncedSearch,
      values.category,
      values.availability,
      values.minPrice,
      values.maxPrice,
      page,
      sortBy,
      sortOrder,
    ],
    queryFn: () => {
      const p = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(page),
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (values.category) p.set('category', values.category);
      if (values.availability === 'available') p.set('isAvailable', 'true');
      if (values.availability === 'unavailable') p.set('isAvailable', 'false');
      if (values.minPrice) p.set('minPrice', values.minPrice);
      if (values.maxPrice) p.set('maxPrice', values.maxPrice);
      return apiFetch<{
        data: Product[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/products?${p}`);
    },
    refetchInterval: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (form.name.length < 3 || form.description.length < 10) {
        throw new Error('VALIDATION');
      }
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: form.price,
        category: form.category,
        preparationTime: form.preparationTime,
        isAvailable: form.isAvailable,
      };
      if (form.imageUrl.trim()) {
        payload.imageUrl = form.imageUrl.trim();
      }
      if (editing) {
        return apiFetch(`/products/${editing.id}`, {
          method: 'PUT',
          json: payload,
        });
      }
      return apiFetch('/products', { method: 'POST', json: payload });
    },
    onSuccess: () => {
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => setFormError('Verifique os campos (nome, descricao, preco, URL)'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setDeleteTarget(null);
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (p: Product) =>
      apiFetch(`/products/${p.id}`, {
        method: 'PUT',
        json: { isAvailable: !p.isAvailable },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['products'] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category as ProductForm['category'],
      preparationTime: p.preparationTime,
      isAvailable: p.isAvailable,
      imageUrl: p.imageUrl ?? '',
    });
    setFormError('');
    setFormOpen(true);
  }

  function handleSort(column: string) {
    const next = toggleSort(sortBy, sortOrder, column);
    setMany({
      sortBy: next.sortBy,
      sortOrder: next.sortOrder,
      page: '1',
    });
  }

  const rows = data?.data ?? [];
  const previewUrl = form.imageUrl.trim() || null;

  return (
    <div className="fm-page">
      <header className="fm-page-header">
        <div>
          <h1 className="fm-page-title">Produtos</h1>
          <p className="fm-page-subtitle">
            Busque, filtre, ordene e clique em um produto para ver detalhes.
          </p>
        </div>
        {isAdmin && (
          <button type="button" onClick={openCreate} className="fm-btn-primary shrink-0">
            Novo produto
          </button>
        )}
      </header>

      <div className="fm-toolbar">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <span className="fm-toolbar-label">Busca</span>
          <input
            type="search"
            placeholder="Buscar por nome..."
            value={values.search}
            onChange={(e) => setMany({ search: e.target.value, page: '1' })}
            className="fm-input"
          />
        </div>
        <div className="w-full sm:w-auto">
          <span className="fm-toolbar-label">Categoria</span>
          <select
            value={values.category}
            onChange={(e) => setMany({ category: e.target.value, page: '1' })}
            className="fm-select min-w-[10rem]"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {productCategoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="fm-toolbar-label">Disponibilidade</span>
          <select
            value={values.availability}
            onChange={(e) => setMany({ availability: e.target.value, page: '1' })}
            className="fm-select min-w-[10rem]"
          >
            <option value="">Todas</option>
            <option value="available">Disponíveis</option>
            <option value="unavailable">Indisponíveis</option>
          </select>
        </div>
        <div>
          <span className="fm-toolbar-label">Preço mín.</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.minPrice}
            onChange={(e) => setMany({ minPrice: e.target.value, page: '1' })}
            className="fm-input w-24"
          />
        </div>
        <div>
          <span className="fm-toolbar-label">Preço máx.</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.maxPrice}
            onChange={(e) => setMany({ maxPrice: e.target.value, page: '1' })}
            className="fm-input w-24"
          />
        </div>
      </div>

      {isLoading && <Skeleton className="h-48 w-full" />}

      {!isLoading && rows.length === 0 && (
        <div className="fm-empty">Nenhum produto encontrado.</div>
      )}

      {!isLoading && rows.length > 0 && (
        <>
          <div className="fm-table-wrap">
            <table className="fm-table">
              <thead>
                <tr>
                  <SortableTh
                    label="Nome"
                    column="name"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTh
                    label="Categoria"
                    column="category"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTh
                    label="Preço"
                    column="price"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTh
                    label="Preparo"
                    column="preparationTime"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTh
                    label="Disponível"
                    column="isAvailable"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  {isAdmin && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer ${!p.isAvailable ? 'opacity-75' : ''}`}
                    onClick={() => setDetail(p)}
                  >
                    <td>
                      <div className="flex gap-3">
                        <ProductThumbnail url={p.imageUrl} name={p.name} />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                          <div className="mt-0.5 line-clamp-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                            {p.description}
                          </div>
                          {!p.isAvailable && (
                            <span className="mt-1 inline-block rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                              Indisponível
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">{productCategoryLabel(p.category)}</td>
                    <td className="tabular-nums font-medium text-slate-800 dark:text-slate-200">
                      R$ {p.price.toFixed(2)}
                    </td>
                    <td className="tabular-nums text-slate-600 dark:text-slate-400">{p.preparationTime} min</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {isAdmin ? (
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            checked={p.isAvailable}
                            disabled={toggleAvailabilityMutation.isPending}
                            aria-label={`Disponível: ${p.name}`}
                            onChange={() => toggleAvailabilityMutation.mutate(p)}
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {p.isAvailable ? 'Sim' : 'Não'}
                          </span>
                        </label>
                      ) : p.isAvailable ? (
                        <span className="text-emerald-700">Sim</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Não</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-sm font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                            onClick={() => openEdit(p)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                            onClick={() => setDeleteTarget(p)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onPageChange={(p) => setParam('page', String(p))}
            />
          )}
        </>
      )}

      {detail && (
        <ProductDetailModal
          product={detail}
          isAdmin={isAdmin}
          onClose={() => setDetail(null)}
          onEdit={() => {
            openEdit(detail);
            setDetail(null);
          }}
        />
      )}

      {formOpen && isAdmin && (
        <Modal open onClose={() => setFormOpen(false)} panelClassName="max-w-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFormError('');
              saveMutation.mutate();
            }}
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {editing ? 'Editar produto' : 'Novo produto'}
            </h2>
            {formError && <p className="fm-error-banner mb-4">{formError}</p>}
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="fm-input mt-1.5"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Descrição
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="fm-input mt-1.5 min-h-[88px] resize-y"
                rows={3}
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
              URL da imagem
              <input
                type="url"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="fm-input mt-1.5"
              />
            </label>
            {previewUrl && (
              <div className="mb-3">
                <ProductThumbnail url={previewUrl} name={form.name || 'Preview'} large />
              </div>
            )}
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Categoria
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as ProductForm['category'],
                  })
                }
                className="fm-select mt-1.5"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {productCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Preço
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="fm-input mt-1.5"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Preparo (min)
                <input
                  type="number"
                  value={form.preparationTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preparationTime: Number(e.target.value),
                    })
                  }
                  className="fm-input mt-1.5"
                />
              </label>
            </div>
            <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm({ ...form, isAvailable: e.target.checked })
                }
              />
              Disponível para pedidos
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="fm-btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="fm-btn-primary">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} panelClassName="max-w-sm">
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirmar exclusão</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Excluir <strong className="text-slate-900 dark:text-slate-100">{deleteTarget.name}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="fm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="fm-btn-danger"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProductDetailModal({
  product,
  isAdmin,
  onClose,
  onEdit,
}: {
  product: Product;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal open onClose={onClose} titleId="product-detail-title" panelClassName="max-w-md">
      <div className="flex items-start justify-between gap-3">
        <h2 id="product-detail-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {product.name}
        </h2>
        <button type="button" className="fm-btn-ghost px-2" onClick={onClose} aria-label="Fechar">
          ✕
        </button>
      </div>
      <div className="mt-4 flex justify-center">
        <ProductThumbnail url={product.imageUrl} name={product.name} large />
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="fm-section-title">Descrição</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">{product.description}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="fm-section-title">Categoria</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">{productCategoryLabel(product.category)}</dd>
          </div>
          <div>
            <dt className="fm-section-title">Preço</dt>
            <dd className="mt-1 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              R$ {product.price.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="fm-section-title">Preparo</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">{product.preparationTime} min</dd>
          </div>
          <div>
            <dt className="fm-section-title">Disponível</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">{product.isAvailable ? 'Sim' : 'Não'}</dd>
          </div>
        </div>
      </dl>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="fm-btn-secondary">
          Fechar
        </button>
        {isAdmin && (
          <button type="button" onClick={onEdit} className="fm-btn-primary">
            Editar
          </button>
        )}
      </div>
    </Modal>
  );
}

function ProductThumbnail({
  url,
  name,
  large = false,
}: {
  url: string | null | undefined;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const size = large ? 'h-40 w-40' : 'h-14 w-14';

  if (!url || failed) {
    return (
      <div
        className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-medium uppercase tracking-wide text-slate-400 ring-1 ring-slate-200`}
        title="Sem imagem"
        aria-hidden
      >
        N/A
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-lg object-cover ring-1 ring-slate-200`}
      referrerPolicy="no-referrer"
    />
  );
}
