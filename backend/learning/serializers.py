from rest_framework import serializers

from .models import Category, GeorgianLetter, Word


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "order"]


class GeorgianLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeorgianLetter
        fields = ["id", "char", "ru_translit", "name", "group", "order"]


class WordSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Word
        fields = ["id", "georgian_text", "ru_translit", "translation_ru", "category", "level"]
