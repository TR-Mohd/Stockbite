import pytest
from datetime import datetime
from app.models import Ingredient
from app.schemas import IngredientResponse

def test_ingredient_response_schema_includes_unit_cost():
    # Create a mock Ingredient model instance
    mock_ingredient = Ingredient(
        id="ing_test_1",
        name="Test Ingredient",
        stock_level=50.0,
        unit="kg",
        reorder_point=10.0,
        category="Test Category",
        unit_cost=150.5,
        last_updated=datetime.utcnow(),
        version_id=1
    )
    
    # Serialize it using the Pydantic schema
    response = IngredientResponse.model_validate(mock_ingredient)
    
    # Assert that unit_cost is present and correct
    assert hasattr(response, "unit_cost")
    assert response.unit_cost == 150.5
