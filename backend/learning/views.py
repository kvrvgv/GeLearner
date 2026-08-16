from rest_framework import viewsets

from .models import Category, GeorgianLetter, Word
from .serializers import CategorySerializer, GeorgianLetterSerializer, WordSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class GeorgianLetterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GeorgianLetter.objects.all()
    serializer_class = GeorgianLetterSerializer


class WordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Word.objects.select_related("category").all()
    serializer_class = WordSerializer
