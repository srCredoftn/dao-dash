import type { Dao } from "@shared/dao";

const API_BASE_URL = "/api";

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem("auth_token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // DAO operations
  async getAllDaos(): Promise<Dao[]> {
    return this.request<Dao[]>("/dao");
  }

  async getDaoById(id: string): Promise<Dao> {
    return this.request<Dao>(`/dao/${id}`);
  }

  async createDao(
    daoData: Omit<Dao, "id" | "createdAt" | "updatedAt">,
  ): Promise<Dao> {
    return this.request<Dao>("/dao", {
      method: "POST",
      body: JSON.stringify(daoData),
    });
  }

  async updateDao(id: string, updates: Partial<Dao>): Promise<Dao> {
    return this.request<Dao>(`/dao/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteDao(id: string): Promise<void> {
    return this.request<void>(`/dao/${id}`, {
      method: "DELETE",
    });
  }

  async getNextDaoNumber(): Promise<string> {
    const response = await this.request<{ nextNumber: string }>(
      "/dao/next-number",
    );
    return response.nextNumber;
  }
}

export const apiService = new ApiService();
