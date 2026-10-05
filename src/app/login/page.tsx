const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email, 
        password,
        options: { 
          data: { 
            full_name: fullName, 
            username: email.split('@')[0] 
          }
        }
      });
      
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        // This only happens if email confirmation is STILL ON
        setError('Please check your email to confirm your account.');
      } else {
        // Success: Email confirmation is OFF, user is logged in
        router.push('/');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };