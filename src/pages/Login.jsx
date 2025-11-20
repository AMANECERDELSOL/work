import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Login usando username y password con función RPC en Supabase
            const { data, error: loginError } = await supabase.rpc('login_with_username', {
                p_username: username,
                p_password: password
            })

            if (loginError) {
                throw loginError
            }

            if (!data || !data.success) {
                setError(data?.error || 'Credenciales inválidas')
                setLoading(false)
                return
            }

            // Guardar user data en localStorage
            const userData = {
                userId: data.user_id,
                username: data.username,
                role: data.role,
                fullName: data.full_name
            }

            onLogin(data.session_token, userData)
        } catch (err) {
            console.error('Login error:', err)
            setError(err.message || 'Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '20px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                    🏗️ FSM Platform
                </h1>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}

                    <div className="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ingresa tu usuario"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        <strong>Usuario de prueba:</strong>
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                        Admin: <code>admin</code> / <code>admin123</code>
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                        Técnico: <code>tecnico1</code> / <code>tecnico123</code>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
