export class ResultPage<T> {
  page: number;
  size: number;
  totalContent?: number;
  totalElements: number;
  totalPages?: number;
  content: Array<T>;
}
