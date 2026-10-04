import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const statuses = ['Planning', 'In Progress', 'On Hold', 'Completed'];
const priorities = ['Low', 'Medium', 'High'];

const emptyProject = () => ({
    client_name: '',
    project_name: '',
    description: '',
    status: 'Planning',
    priority: 'Medium',
    start_date: new Date().toISOString().slice(0, 10),
    due_date: '',
});

function firstError(errors) {
    return Object.values(errors ?? {}).flat()[0] ?? 'Something went wrong. Please try again.';
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(body.message ?? firstError(body.errors));
        error.fieldErrors = body.errors ?? {};
        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function formatDate(value) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function daysUntil(value) {
    if (!value) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(`${value}T00:00:00`);
    return Math.ceil((dueDate - today) / 86_400_000);
}

function dueDescription(project) {
    if (project.status === 'Completed') {
        return 'Completed';
    }

    const days = daysUntil(project.due_date);

    if (days === null) {
        return 'No due date';
    }

    if (days < 0) {
        return `${Math.abs(days)}d overdue`;
    }

    if (days === 0) {
        return 'Due today';
    }

    if (days === 1) {
        return 'Due tomorrow';
    }

    return `Due in ${days} days`;
}

function ProjectForm({ project, fieldErrors, saving, onCancel, onSubmit }) {
    const [form, setForm] = useState(() => project ?? emptyProject());

    const updateField = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const submit = (event) => {
        event.preventDefault();
        onSubmit({
            ...form,
            description: form.description.trim() || null,
        });
    };

    return (
        <form className="project-form" onSubmit={submit} noValidate>
            <div className="form-grid">
                <label className="field">
                    <span>Client name <b>*</b></span>
                    <input
                        autoFocus
                        name="client_name"
                        value={form.client_name}
                        onChange={updateField}
                        placeholder="e.g. Northstar Studio"
                        aria-invalid={Boolean(fieldErrors.client_name)}
                    />
                    <FieldError error={fieldErrors.client_name} />
                </label>

                <label className="field">
                    <span>Project name <b>*</b></span>
                    <input
                        name="project_name"
                        value={form.project_name}
                        onChange={updateField}
                        placeholder="e.g. Website redesign"
                        aria-invalid={Boolean(fieldErrors.project_name)}
                    />
                    <FieldError error={fieldErrors.project_name} />
                </label>

                <label className="field field--wide">
                    <span>Description</span>
                    <textarea
                        name="description"
                        value={form.description ?? ''}
                        onChange={updateField}
                        placeholder="What does success look like for this project?"
                        rows="3"
                        aria-invalid={Boolean(fieldErrors.description)}
                    />
                    <FieldError error={fieldErrors.description} />
                </label>

                <label className="field">
                    <span>Status <b>*</b></span>
                    <select name="status" value={form.status} onChange={updateField} aria-invalid={Boolean(fieldErrors.status)}>
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <FieldError error={fieldErrors.status} />
                </label>

                <label className="field">
                    <span>Priority <b>*</b></span>
                    <select name="priority" value={form.priority} onChange={updateField} aria-invalid={Boolean(fieldErrors.priority)}>
                        {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                    </select>
                    <FieldError error={fieldErrors.priority} />
                </label>

                <label className="field">
                    <span>Start date <b>*</b></span>
                    <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={updateField}
                        aria-invalid={Boolean(fieldErrors.start_date)}
                    />
                    <FieldError error={fieldErrors.start_date} />
                </label>

                <label className="field">
                    <span>Due date <b>*</b></span>
                    <input
                        type="date"
                        name="due_date"
                        value={form.due_date}
                        min={form.start_date || undefined}
                        onChange={updateField}
                        aria-invalid={Boolean(fieldErrors.due_date)}
                    />
                    <FieldError error={fieldErrors.due_date} />
                </label>
            </div>

            <div className="modal-actions">
                <button type="button" className="button button--quiet" onClick={onCancel} disabled={saving}>Cancel</button>
                <button type="submit" className="button button--primary" disabled={saving}>
                    {saving ? 'Saving…' : project ? 'Save changes' : 'Create project'}
                </button>
            </div>
        </form>
    );
}

function FieldError({ error }) {
    if (!error) {
        return null;
    }

    return <small className="field-error">{error[0]}</small>;
}

function Modal({ children, title, subtitle, onClose, wide = false }) {
    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className={`modal ${wide ? 'modal--wide' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="modal-heading">
                    <div>
                        <p className="eyebrow">Project workspace</p>
                        <h2 id="modal-title">{title}</h2>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
                </div>
                {children}
            </section>
        </div>
    );
}

function App() {
    const [projects, setProjects] = useState([]);
    const [filters, setFilters] = useState({ search: '', status: '', priority: '', sort: 'due_date' });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [modalProject, setModalProject] = useState(undefined);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const loadProjects = useCallback(async (activeFilters) => {
        setLoading(true);
        setLoadError('');

        const params = new URLSearchParams(
            Object.entries(activeFilters).filter(([, value]) => value),
        );

        try {
            const data = await apiRequest(`/api/projects?${params.toString()}`);
            setProjects(data);
        } catch (error) {
            setLoadError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => loadProjects(filters), 180);
        return () => window.clearTimeout(timer);
    }, [filters, loadProjects]);

    const stats = useMemo(() => {
        const active = projects.filter((project) => project.status === 'In Progress').length;
        const dueSoon = projects.filter((project) => {
            const days = daysUntil(project.due_date);
            return project.status !== 'Completed' && days !== null && days >= 0 && days <= 7;
        }).length;
        const highPriority = projects.filter((project) => project.priority === 'High' && project.status !== 'Completed').length;

        return [
            { label: 'All projects', value: projects.length, tone: 'slate' },
            { label: 'In progress', value: active, tone: 'blue' },
            { label: 'Due this week', value: dueSoon, tone: 'orange' },
            { label: 'High priority', value: highPriority, tone: 'pink' },
        ];
    }, [projects]);

    const updateFilter = (event) => {
        const { name, value } = event.target;
        setFilters((current) => ({ ...current, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ search: '', status: '', priority: '', sort: 'due_date' });
    };

    const openCreateModal = () => {
        setFieldErrors({});
        setModalProject(null);
    };

    const openEditModal = (project) => {
        setFieldErrors({});
        setModalProject({ ...project, description: project.description ?? '' });
    };

    const closeProjectModal = () => {
        if (!saving) {
            setModalProject(undefined);
            setFieldErrors({});
        }
    };

    const announce = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 3200);
    };

    const saveProject = async (projectData) => {
        const isEditing = Boolean(modalProject?.id);
        setSaving(true);
        setFieldErrors({});

        try {
            await apiRequest(isEditing ? `/api/projects/${modalProject.id}` : '/api/projects', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData),
            });
            setModalProject(undefined);
            announce(isEditing ? 'Project updated successfully.' : 'Project created successfully.');
            await loadProjects(filters);
        } catch (error) {
            setFieldErrors(error.fieldErrors ?? {});
            if (!error.fieldErrors || Object.keys(error.fieldErrors).length === 0) {
                setLoadError(error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const deleteProject = async () => {
        if (!projectToDelete) {
            return;
        }

        setSaving(true);
        try {
            await apiRequest(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
            setProjectToDelete(null);
            announce('Project deleted.');
            await loadProjects(filters);
        } catch (error) {
            setLoadError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const hasFilters = filters.search || filters.status || filters.priority || filters.sort !== 'due_date';

    return (
        <div className="app-shell">
            <header className="topbar">
                <a className="brand" href="/" aria-label="Project Pulse home">
                    <span className="brand-mark"><i /><i /><i /></span>
                    <span>Project<span>Pulse</span></span>
                </a>
                <div className="topbar-copy">Client delivery, in focus</div>
                <button className="button button--primary" onClick={openCreateModal}>
                    <span aria-hidden="true">+</span> New project
                </button>
            </header>

            <main className="main-content">
                <section className="hero">
                    <div>
                        <p className="eyebrow">Client project tracker</p>
                        <h1>Keep every client project moving.</h1>
                        <p className="hero-copy">A calm, clear view of what the team is planning, delivering, and wrapping up.</p>
                    </div>
                    <div className="hero-orbit" aria-hidden="true"><span /><i /><b /></div>
                </section>

                <section className="stats-grid" aria-label="Project summary">
                    {stats.map((stat) => (
                        <article className={`stat-card stat-card--${stat.tone}`} key={stat.label}>
                            <span>{stat.label}</span>
                            <strong>{stat.value}</strong>
                        </article>
                    ))}
                </section>

                <section className="workspace" aria-labelledby="projects-heading">
                    <div className="workspace-heading">
                        <div>
                            <p className="eyebrow">Portfolio</p>
                            <h2 id="projects-heading">Projects <span>{loading ? '…' : projects.length}</span></h2>
                        </div>
                        <button className="button button--secondary workspace-add" onClick={openCreateModal}><span aria-hidden="true">+</span> Add project</button>
                    </div>

                    <div className="filters">
                        <label className="search-field">
                            <span className="sr-only">Search projects</span>
                            <span aria-hidden="true">⌕</span>
                            <input name="search" value={filters.search} onChange={updateFilter} placeholder="Search clients or projects" />
                        </label>
                        <label className="select-field">
                            <span className="sr-only">Filter by status</span>
                            <select name="status" value={filters.status} onChange={updateFilter}>
                                <option value="">All statuses</option>
                                {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                        </label>
                        <label className="select-field">
                            <span className="sr-only">Filter by priority</span>
                            <select name="priority" value={filters.priority} onChange={updateFilter}>
                                <option value="">All priorities</option>
                                {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                            </select>
                        </label>
                        <label className="select-field select-field--sort">
                            <span className="sr-only">Sort projects</span>
                            <select name="sort" value={filters.sort} onChange={updateFilter}>
                                <option value="due_date">Sort: Due date</option>
                                <option value="created_at">Sort: Newest</option>
                                <option value="project_name">Sort: Project name</option>
                            </select>
                        </label>
                        {hasFilters && <button className="clear-button" onClick={clearFilters}>Clear</button>}
                    </div>

                    {loadError && (
                        <div className="alert" role="alert">
                            <span>!</span>
                            <p>{loadError}</p>
                            <button onClick={() => loadProjects(filters)}>Try again</button>
                        </div>
                    )}

                    <div className="project-list">
                        <div className="project-table-head" aria-hidden="true">
                            <span>Client & project</span><span>Status</span><span>Priority</span><span>Timeline</span><span />
                        </div>
                        {loading ? (
                            <div className="loading-state"><span className="spinner" /> Loading projects…</div>
                        ) : projects.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">⌁</span>
                                <h3>{hasFilters ? 'No matching projects' : 'Your project list is ready'}</h3>
                                <p>{hasFilters ? 'Try adjusting your search or filters.' : 'Add your first client project to start tracking delivery.'}</p>
                                {!hasFilters && <button className="button button--primary" onClick={openCreateModal}>Create first project</button>}
                            </div>
                        ) : projects.map((project) => (
                            <article className="project-row" key={project.id}>
                                <div className="project-identity">
                                    <div className="project-initial">{project.client_name.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h3>{project.project_name}</h3>
                                        <p>{project.client_name}</p>
                                    </div>
                                </div>
                                <div className="project-cell" data-label="Status"><span className={`badge badge--${project.status.toLowerCase().replaceAll(' ', '-')}`}>{project.status}</span></div>
                                <div className="project-cell" data-label="Priority"><span className={`priority priority--${project.priority.toLowerCase()}`}><i />{project.priority}</span></div>
                                <div className="project-cell timeline" data-label="Due date"><strong>{formatDate(project.due_date)}</strong><span className={daysUntil(project.due_date) < 0 && project.status !== 'Completed' ? 'overdue' : ''}>{dueDescription(project)}</span></div>
                                <div className="row-actions">
                                    <button className="text-button" onClick={() => openEditModal(project)}>Edit</button>
                                    <button className="delete-button" onClick={() => setProjectToDelete(project)} aria-label={`Delete ${project.project_name}`}>×</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            {modalProject !== undefined && (
                <Modal
                    title={modalProject ? 'Edit project' : 'New project'}
                    subtitle={modalProject ? `Update the delivery details for ${modalProject.project_name}.` : 'Give your team the context it needs to deliver well.'}
                    onClose={closeProjectModal}
                    wide
                >
                    <ProjectForm project={modalProject} fieldErrors={fieldErrors} saving={saving} onCancel={closeProjectModal} onSubmit={saveProject} />
                </Modal>
            )}

            {projectToDelete && (
                <Modal title="Delete project?" subtitle={`This will permanently remove “${projectToDelete.project_name}” from the tracker.`} onClose={() => !saving && setProjectToDelete(null)}>
                    <div className="confirm-icon" aria-hidden="true">×</div>
                    <p className="confirm-copy">This action can’t be undone. Make sure the project is no longer needed before continuing.</p>
                    <div className="modal-actions">
                        <button className="button button--quiet" onClick={() => setProjectToDelete(null)} disabled={saving}>Keep project</button>
                        <button className="button button--danger" onClick={deleteProject} disabled={saving}>{saving ? 'Deleting…' : 'Delete project'}</button>
                    </div>
                </Modal>
            )}

            {toast && <div className="toast" role="status">✓ {toast}</div>}
        </div>
    );
}

createRoot(document.getElementById('app')).render(<App />);
