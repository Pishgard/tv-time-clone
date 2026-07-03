"""Shared utilities used across apps."""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Page-number pagination with sensible defaults."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
