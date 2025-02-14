const loadProfileData = async () => {
  try {
    setLoading(true);
    // Use the new by-username endpoint
    const response = await ddApi.users.getOne(`by-username/${identifier}`);
    setProfileData(response);
  } catch (error) {
    console.error("Error loading profile data:", error);
    setError("Failed to load profile data");
  } finally {
    setLoading(false);
  }
};
