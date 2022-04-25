import { DataStorageService } from './../../shared/data-storage.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Recipe } from '../recipe.model';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { RecipeService } from '../recipe.service';
import { Ingredient } from '../../shared/ingredient.model';

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  styleUrls: ['./recipe-edit.component.css'],
})
export class RecipeEditComponent implements OnInit {
  recipeId: number;
  recipe: Recipe | null;
  editMode = false;
  form: FormGroup;
  message: string;

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private router: Router,
    private dataStorageService: DataStorageService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      // The + sign converts the id from string to int.
      this.recipeId = +params['id'];
      // if id doesnt exists -> params.id==null so edit mode will be false.
      this.editMode = params['id'] != null;
      if (this.editMode) {
        this.recipe = this.recipeService.getRecipe(this.recipeId);
        this.message = 'Edit ' + this.recipe.name + ' recipe';
      } else {
        this.recipe = null;
        this.message = 'Add a new Recipe';
      }
      this.initForm();
    });
  }

  private initForm(): void {
    let recipeName = '';
    let recipeImagePath = '';
    let recipeDescription = '';
    const recipeIngredients: FormGroup[] = [];
    if (this.editMode && this.recipe != null) {
      recipeName = this.recipe.name;
      recipeImagePath = this.recipe.imagePath;
      recipeDescription = this.recipe.description;
      if (this.recipe.ingredients) {
        for (const ingredient of this.recipe.ingredients) {
          recipeIngredients.push(
            new FormGroup({
              name: new FormControl(ingredient.name),
              amount: new FormControl(ingredient.amount, [Validators.pattern("^[0-9,.]*$")]),
            })
          );
        }
      }
    }
    this.form = new FormGroup({
      name: new FormControl(recipeName, Validators.required),
      description: new FormControl(recipeDescription),
      imagePath: new FormControl(recipeImagePath),
      ingredients: new FormArray(recipeIngredients),
    });
  }

  onSubmit(): void {
    const name = this.form.value.name;
    const description = this.form.value.description;
    const imagePath = this.form.value.imagePath;
    const ingredients = this.form.get('ingredients') as FormArray;
    const newIngredients: Ingredient[] = [];
    ingredients.controls.forEach((item) => {
      if (item.value.name != null && item.value.name != ''
        && item.value.amount != null && item.value.amount != '') {
        newIngredients.push(new Ingredient(item.value.name, item.value.amount));
      }
    });

    if (this.editMode) {
      this.recipeService.updateRecipe(
        this.recipeId,
        name,
        description,
        imagePath,
        newIngredients
      );
    } else {
      const recipe = new Recipe(name, description, imagePath, newIngredients);
      this.recipeService.addRecipe(recipe);
    }
    this.dataStorageService.storeRecipes();
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  get controls(): AbstractControl[] {
    return (this.form.get('ingredients') as FormArray).controls;
  }

  onAddIngredient(): void {
    length = (this.form.get('ingredients') as FormArray).length + 1;
    (this.form.get('ingredients') as FormArray).push(
      new FormGroup({
        name: new FormControl(null),
        amount: new FormControl(null, [Validators.pattern("^[0-9,.]*$")]),
      })
    );
  }

  onDeleteIngredient(idx: number): void {
    (this.form.get('ingredients') as FormArray).removeAt(idx);
  }

  isIngredientInvalid() {
    const ingredientsControl = this.form.get('ingredients')
    if (ingredientsControl != null && ingredientsControl.touched) {
      var isInvalid = false
      this.controls.forEach(control => {
        if (!control.valid) {
          isInvalid = true
        }
      });
      return isInvalid
    }
    else return false
  }

  isNameInvalid() {
    const nameControl = this.form.get('name')
    return nameControl != null && nameControl.invalid && nameControl.touched
  }


}