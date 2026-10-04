<?php

namespace Tests\Feature;

use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_projects_with_filters(): void
    {
        $matchingProject = Project::factory()->create([
            'client_name' => 'Northstar Studio',
            'project_name' => 'Website redesign',
            'status' => 'In Progress',
            'priority' => 'High',
        ]);
        Project::factory()->create([
            'client_name' => 'Cedar Group',
            'status' => 'Planning',
            'priority' => 'Low',
        ]);

        $response = $this->getJson('/api/projects?search=Northstar&status=In%20Progress&priority=High');

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $matchingProject->id)
            ->assertJsonPath('0.client_name', 'Northstar Studio');
    }

    public function test_it_creates_a_project(): void
    {
        $payload = $this->projectPayload();

        $response = $this->postJson('/api/projects', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('client_name', $payload['client_name'])
            ->assertJsonPath('status', 'Planning');

        $this->assertDatabaseHas('projects', [
            'client_name' => $payload['client_name'],
            'project_name' => $payload['project_name'],
            'status' => 'Planning',
            'priority' => 'High',
        ]);
    }

    public function test_it_returns_validation_errors_for_invalid_project_data(): void
    {
        $payload = $this->projectPayload([
            'client_name' => '',
            'project_name' => '',
            'status' => 'Cancelled',
            'priority' => 'Urgent',
            'start_date' => '2026-11-10',
            'due_date' => '2026-11-09',
        ]);

        $response = $this->postJson('/api/projects', $payload);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'client_name',
                'project_name',
                'status',
                'priority',
                'due_date',
            ]);
    }

    public function test_it_shows_updates_and_deletes_a_project(): void
    {
        $project = Project::factory()->create();

        $this->getJson("/api/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('id', $project->id);

        $payload = $this->projectPayload([
            'client_name' => 'Acme Digital',
            'project_name' => 'Brand refresh',
            'status' => 'Completed',
            'priority' => 'Medium',
        ]);

        $this->putJson("/api/projects/{$project->id}", $payload)
            ->assertOk()
            ->assertJsonPath('project_name', 'Brand refresh')
            ->assertJsonPath('status', 'Completed');

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'client_name' => 'Acme Digital',
            'status' => 'Completed',
        ]);

        $this->deleteJson("/api/projects/{$project->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, string>
     */
    private function projectPayload(array $overrides = []): array
    {
        return array_merge([
            'client_name' => 'Northstar Studio',
            'project_name' => 'Platform refresh',
            'description' => 'A focused redesign for the client portal.',
            'status' => 'Planning',
            'priority' => 'High',
            'start_date' => '2026-11-01',
            'due_date' => '2026-12-15',
        ], $overrides);
    }
}
