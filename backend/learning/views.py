from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets

from .models import Category, GeorgianLetter, Word
from .serializers import CategorySerializer, GeorgianLetterSerializer, WordSerializer

# Данные меняются редко (seed_data + рестарт), поэтому список можно спокойно
# кэшировать на час, не гоняя лишний раз в БД на каждый запрос.
CACHE_TTL = 60 * 60


@method_decorator(cache_page(CACHE_TTL), name="list")
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


@method_decorator(cache_page(CACHE_TTL), name="list")
class GeorgianLetterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GeorgianLetter.objects.all()
    serializer_class = GeorgianLetterSerializer


@method_decorator(cache_page(CACHE_TTL), name="list")
class WordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Word.objects.select_related("category").all()
    serializer_class = WordSerializer
