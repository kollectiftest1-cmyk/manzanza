from rest_framework.pagination import PageNumberPagination

class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class DefaultPagination(PageNumberPagination):
    """Pagination par défaut : 20 éléments, ajustable par ?page_size= (500 maximum)."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 500
