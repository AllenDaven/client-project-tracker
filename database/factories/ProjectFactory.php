<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_name' => fake()->company(),
            'project_name' => fake()->catchPhrase(),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(Project::STATUSES),
            'priority' => fake()->randomElement(Project::PRIORITIES),
            'start_date' => now()->subDays(fake()->numberBetween(1, 30))->toDateString(),
            'due_date' => now()->addDays(fake()->numberBetween(1, 60))->toDateString(),
        ];
    }
}
