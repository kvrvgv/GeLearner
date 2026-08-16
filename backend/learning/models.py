from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

    def __str__(self):
        return self.name


class GeorgianLetter(models.Model):
    GROUP_CHOICES = [
        ("vowel", "Гласная"),
        ("k", "К-звуки"),
        ("t", "Т-звуки"),
        ("p", "П/Ф-звуки"),
        ("s", "С/Ш-звуки"),
        ("ts", "Ц-звуки"),
        ("ch", "Ч-звуки"),
        ("guttural", "Гортанные"),
        ("other", "Прочие"),
    ]

    char = models.CharField(max_length=1, unique=True)
    ru_translit = models.CharField(
        max_length=4,
        help_text="Как звучит буква по-русски, напр. 'дж' для ჯ",
    )
    name = models.CharField(max_length=50, help_text="Название буквы", blank=True)
    group = models.CharField(max_length=20, choices=GROUP_CHOICES, default="other")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        verbose_name = "Буква грузинского алфавита"
        verbose_name_plural = "Буквы грузинского алфавита"

    def __str__(self):
        return f"{self.char} → {self.ru_translit}"


class Word(models.Model):
    georgian_text = models.CharField(max_length=100)
    ru_translit = models.CharField(
        max_length=150,
        help_text="Как слово читается по-русски (авто-генерируется из букв, но можно поправить)",
    )
    translation_ru = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, related_name="words", on_delete=models.CASCADE
    )

    class Meta:
        ordering = ["category__order", "georgian_text"]
        verbose_name = "Слово"
        verbose_name_plural = "Слова"

    def __str__(self):
        return f"{self.georgian_text} ({self.ru_translit}) — {self.translation_ru}"
