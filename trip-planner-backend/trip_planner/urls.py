from django.urls import path
from .views import HealthAPIView, TripPlanAPIView

urlpatterns = [
    path('health/', HealthAPIView.as_view()),
    path('plan-trip/', TripPlanAPIView.as_view()),
]