import react from 'react'

function Login() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ minWidth: '300px', maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Login</h2>
        <form>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              id="email" 
              placeholder="Enter your email" 
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="password" 
              placeholder="Enter your password" 
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">Login</button>
          <div className="text-center mt-3">
            <a href="/favourites" className="text-decoration-none">Go to Favourites</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
