class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    
    this.token = await result.user.getIdToken();
    this.user = {
      email: result.user.email,
      uid: result.user.uid,
      displayName: result.user.displayName
    };
    
    localStorage.setItem('authToken', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    
    return this.user;
  }

  async signOut() {
    await firebase.auth().signOut();
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Global instance
window.auth = new AuthManager();