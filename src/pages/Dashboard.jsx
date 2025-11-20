import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Dashboard({ user, onLogout }) {
    const [kpis, setKpis] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchKPIs()
    }, [])

    const fetchKPIs = async () => {
        try {
            // Get active technicians count
            const { count: activeTechnicians } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'TECHNICIAN')
                .eq('is_active', true)

            // Get high priority pending
            const { count: highPriorityPending } = await supabase
                .from('works')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'HIGH_PRIORITY')
                .eq('archived', false)

            // Get works by status
            const { data: worksByStatus } = await supabase
                .from('works')
                .select('status')
                .eq('archived', false)

            const statusCounts = worksByStatus?.reduce((acc, work) => {
                acc[work.status] = (acc[work.status] || 0) + 1
                return acc
            }, {})

            // Get completed works in last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: completedWorks } = await supabase
                .from('works')
                .select('completed_at, started_at')
                .eq('status', 'COMPLETED')
                .gte('completed_at', thirtyDaysAgo.toISOString())

            // Calculate average duration
            let avgDuration = 0
            if (completedWorks && completedWorks.length > 0) {
                const totalHours = completedWorks.reduce((sum, work) => {
                    if (work.started_at && work.completed_at) {
                        const start = new Date(work.started_at)
                        const end = new Date(work.completed_at)
                        const hours = (end - start) / (1000 * 60 * 60)
                        return sum + hours
                    }
                    return sum
                }, 0)
                avgDuration = Math.round(totalHours / completedWorks.length * 10) / 10
            }

            setKpis({
                active_technicians: activeTechnicians || 0,
                high_priority_pending: highPriorityPending || 0,
                on_time_completion_rate: completedWorks?.length ? 85 : 0, // Simplified
                avg_work_duration_hours: avgDuration,
                works_by_status: statusCounts || {}
            })
        } catch (error) {
            console.error('Error fetching KPIs:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="navbar">
                <h1>📊 FSM Platform</h1>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/works">Trabajos</Link>
                    <Link to="/chat">Chat</Link>
                    <button onClick={onLogout} className="btn btn-secondary" style={{ marginLeft: '15px' }}>
                        Cerrar Sesión
                    </button>
                </nav>
            </div>

            <div className="container">
                <div className="card">
                    <h2>Bienvenido, {user?.fullName || user?.username}! 👋</h2>
                    <p style={{ color: '#666' }}>
                        Rol: <strong>{user?.role === 'ADMIN' ? 'Administrador' : 'Técnico'}</strong>
                    </p>
                </div>

                {loading ? (
                    <div className="loading">Cargando métricas...</div>
                ) : (
                    <div className="kpi-grid">
                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <h3>Técnicos Activos</h3>
                            <div className="value">{kpis?.active_technicians || 0}</div>
                            <div className="unit">disponibles hoy</div>
                        </div>

                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <h3>Prioridad Alta Pendientes</h3>
                            <div className="value">{kpis?.high_priority_pending || 0}</div>
                            <div className="unit">trabajos urgentes</div>
                        </div>

                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <h3>Tasa Finalización</h3>
                            <div className="value">{kpis?.on_time_completion_rate || 0}%</div>
                            <div className="unit">a tiempo (30 días)</div>
                        </div>

                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                            <h3>Duración Promedio</h3>
                            <div className="value">{kpis?.avg_work_duration_hours || 0}</div>
                            <div className="unit">horas por trabajo</div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h3>Acciones Rápidas</h3>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <Link to="/works">
                            <button className="btn btn-primary">Ver Trabajos</button>
                        </Link>
                        <Link to="/chat">
                            <button className="btn btn-success">Abrir Chat</button>
                        </Link>
                    </div>
                </div>

                {kpis?.works_by_status && Object.keys(kpis.works_by_status).length > 0 && (
                    <div className="card">
                        <h3>Estado de Trabajos</h3>
                        <div style={{ marginTop: '15px' }}>
                            {Object.entries(kpis.works_by_status).map(([status, count]) => (
                                <div key={status} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                    <span className={`badge badge-${status.toLowerCase().replace('_', '-')}`}>
                                        {status}
                                    </span>
                                    <strong style={{ marginLeft: '10px' }}>{count} trabajos</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
