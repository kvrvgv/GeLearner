from django.contrib import admin

from .models import Category, GeorgianLetter, Word


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order", "word_count")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("order", "name")
    search_fields = ("name", "slug")

    @admin.display(description="Слов")
    def word_count(self, obj):
        return obj.words.count()


@admin.register(GeorgianLetter)
class GeorgianLetterAdmin(admin.ModelAdmin):
    list_display = ("order", "char", "ru_translit", "name", "group")
    list_editable = ("ru_translit", "name", "group")
    ordering = ("order",)


@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    list_display = ("georgian_text", "ru_translit", "translation_ru", "category", "level")
    list_filter = ("category", "level")
    list_editable = ("level",)
    search_fields = ("georgian_text", "ru_translit", "translation_ru")
    autocomplete_fields = ("category",)
