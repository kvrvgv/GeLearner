from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, GeorgianLetterViewSet, WordViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("letters", GeorgianLetterViewSet)
router.register("words", WordViewSet)

urlpatterns = router.urls
