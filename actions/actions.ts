// api.ts
import { supabase } from "@/lib/supabase-server";
import { User, Connection, ConnectionStatus } from "@/lib/types";

export async function fetchUserProfile(userId: string): Promise<User> {
	try {
		// Fetch the user profile
		const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single();

		if (userError) throw userError;

		// Fetch the user's skills
		const { data: userSkills, error: skillsError } = await supabase
			.from("user_skills")
			.select(
				`
        skill_id,
        skills (
          id,
          name
        )
      `
			)
			.eq("user_id", userId);

		if (skillsError) throw skillsError;

		// Format user data with skills
		const userWithSkills: User = {
			...userData,
			skills: userSkills?.map((item) => item.skills) || [],
		};

		return userWithSkills;
	} catch (error) {
		throw error;
	}
}

export async function fetchUserConnections(userId: string): Promise<Connection[]> {
	try {
		// Fetch connections where user is user_a
		const { data: connectionsAsA, error: errorA } = await supabase
			.from("connections")
			.select(
				`
        id,
        user_a,
        user_b,
        status,
        created_at
      `
			)
			.eq("user_a", userId)
			.eq("status", "accepted");

		if (errorA) throw errorA;

		// Fetch connections where user is user_b
		const { data: connectionsAsB, error: errorB } = await supabase
			.from("connections")
			.select(
				`
        id,
        user_a,
        user_b,
        status,
        created_at
      `
			)
			.eq("user_b", userId)
			.eq("status", "accepted");

		if (errorB) throw errorB;

		// Combine connections and get connected user details
		const allConnections = [...(connectionsAsA || []), ...(connectionsAsB || [])];

		// Fetch details for each connected user
		const connectionsWithProfiles: Connection[] = await Promise.all(
			allConnections.map(async (connection) => {
				const connectedUserId = connection.user_a === userId ? connection.user_b : connection.user_a;

				// Get user profile
				const connectedUserData = await fetchUserProfile(connectedUserId);

				return {
					...connection,
					connected_user: connectedUserData,
				};
			})
		);

		return connectionsWithProfiles;
	} catch (error) {
		throw error;
	}
}

export async function fetchPendingConnectionRequests(userId: string): Promise<Connection[]> {
	try {
		// Fetch pending connections where this user is the receiver
		const { data: pendingRequests, error } = await supabase
			.from("connections")
			.select(
				`
        id,
        user_a,
        user_b,
        status,
        created_at
      `
			)
			.eq("user_b", userId)
			.eq("status", "pending");

		if (error) throw error;

		// Fetch details for each requesting user
		const requestsWithProfiles: Connection[] = await Promise.all(
			(pendingRequests || []).map(async (request) => {
				const requestingUserId = request.user_a;

				// Get user profile
				const requestUserData = await fetchUserProfile(requestingUserId);

				return {
					...request,
					request_user: requestUserData,
				};
			})
		);

		return requestsWithProfiles;
	} catch (error) {
		throw error;
	}
}

export async function updateConnectionStatus(connectionId: string, status: ConnectionStatus): Promise<boolean> {
	try {
		const { error } = await supabase
			.from("connections")
			.update({
				status: status,
			})
			.eq("id", connectionId);

		if (error) throw error;
		return true;
	} catch (error) {
		throw error;
	}
}
