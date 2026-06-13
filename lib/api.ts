import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("admin_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = Cookies.get("admin_refresh_token");
        const { data } = await axios.post(`${API_URL}/accounts/refresh-token`, { refreshToken: refresh });
        Cookies.set("admin_access_token", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        Cookies.remove("admin_access_token");
        Cookies.remove("admin_refresh_token");
        Cookies.remove("admin_user_data");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const adminLogin = (email: string, password: string) =>
  api.post("/accounts/login", { email, password, role: "ADMIN" });

// Dashboard
export const getDashboardStats = () => api.get("/dashboard/stats");
export const getMonthlyRevenue = (year: number) =>
  api.get(`/adminpanel/monthly-revenue?year=${year}`);

// Courses — POST is /adminpanel/course, GET list is /courses (public)
export const getCourses = (page = 1, limit = 50) =>
  api.get(`/courses?page=${page}&limit=${limit}`);
export const getCourse = (id: string) => api.get(`/courses/${id}`);
export const createCourse = (data: FormData) =>
  api.post("/adminpanel/course", data, { headers: { "Content-Type": "multipart/form-data" } });
export const updateCourse = (id: string, data: FormData) =>
  api.put(`/adminpanel/courses/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteCourse = (id: string) => api.delete(`/adminpanel/courses/${id}`);

// Products (lessons inside a course)
export const createProduct = (data: { name: string; description?: string; courseId: string; lessonType: string; textContent?: string }) =>
  api.post("/adminpanel/products", data);

export const getProduct = (productId: string) => api.get(`/course/product/${productId}`);

export const deleteProductVideo = (productId: string) =>
  api.delete(`/products/${productId}/video`);

// Direct-to-R2 upload flow
export const getUploadUrl = (productId: string, fileName: string, contentType: string) =>
  api.post("/adminpanel/upload-url", { productId, fileName, contentType });

export const confirmUpload = (productId: string) =>
  api.post(`/adminpanel/upload-complete/${productId}`);

export const startHls = (productId: string) =>
  api.post(`/adminpanel/products/${productId}/start-hls`);

export const reorderLessons = (items: { id: string; order: number }[]) =>
  api.patch("/adminpanel/products/reorder", { items });

// Course FAQs
export const getCourseFaqs = (courseId: string) =>
  api.get(`/course-all-faqs/${courseId}`);
export const createCourseFaq = (courseId: string, question: string, answer: string) =>
  api.post("/adminpanel/course-faqs", { courseId, question, answer });
export const deleteCourseFaq = (id: string) =>
  api.delete(`/adminpanel/course-faqs/${id}`);

// Course Reviews (admin)
export const adminAddReview = (courseId: string, data: { reviewerName: string; details: string; ratting: number }) =>
  api.post(`/adminpanel/courses/${courseId}/reviews`, data);
export const adminDeleteReview = (id: string) =>
  api.delete(`/adminpanel/reviews/${id}`);

// Upload directly to R2 using a presigned PUT URL (XHR for progress)
export const uploadToR2 = (
  presignedUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

// Categories
export const getCategories = () => api.get("/categories");
export const createCategory = (data: FormData) =>
  api.post("/adminpanel/category", data, { headers: { "Content-Type": "multipart/form-data" } });
export const updateCategory = (id: string, data: FormData) =>
  api.put(`/adminpanel/category/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteCategory = (id: string) => api.delete(`/category/${id}`);

// Users
export const getCustomers = (page = 1) =>
  api.get(`/adminpanel/customers?page=${page}&limit=50`);
export const getAdmins = () => api.get("/adminpanel/admins");
export const getStaff = () => api.get("/adminpanel/staff");

// Creators & Authors (needed in course create form)
export const getCreators = () => api.get("/creators");
export const getAuthors = () => api.get("/author");

// Course Orders
export const getOrders = (page = 1) =>
  api.get(`/adminpanel/orders?page=${page}&limit=50`);

// Marketplace Orders
export const getMarketplaceOrders = (page = 1, status?: string) =>
  api.get(`/adminpanel/marketplace-orders?page=${page}&limit=50${status ? `&status=${status}` : ''}`);
export const updateMarketplaceOrderStatus = (id: string, status: string) =>
  api.patch(`/adminpanel/marketplace-orders/${id}/status`, { status });

// Blogs
export const getBlogs = () => api.get("/blogs");
export const createBlog = (data: FormData) =>
  api.post("/adminpanel/blogs", data, { headers: { "Content-Type": "multipart/form-data" } });
export const updateBlog = (id: string, data: FormData) =>
  api.put(`/adminpanel/blogs/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteBlog = (id: string) => api.delete(`/adminpanel/blogs/${id}`);

// Banners
export const getBanners = () => api.get("/banners");
export const createBanner = (data: FormData) =>
  api.post("/adminpanel/banners", data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteBanner = (id: string) => api.delete(`/adminpanel/banners/${id}`);

// Testimonials
export const getTestimonials = () => api.get("/testimonials");
export const createTestimonial = (data: FormData) =>
  api.post("/adminpanel/testimonials", data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteTestimonial = (id: string) => api.delete(`/adminpanel/testimonials/${id}`);

// Success Stories
export const getSuccessStories = () => api.get("/success");
export const createSuccessStory = (data: FormData) =>
  api.post("/adminpanel/success", data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteSuccessStory = (id: string) => api.delete(`/success/${id}`);

// FAQs
export const getGeneralFAQs = () => api.get("/general-faqs");
export const createGeneralFAQ = (data: { question: string; answer: string }) =>
  api.post("/adminpanel/general-faqs", data);
export const deleteGeneralFAQ = (id: string) => api.delete(`/adminpanel/general-faqs/${id}`);

// Gallery
export const getGallery = () => api.get("/feature-gallery");
export const createGallery = (data: FormData) =>
  api.post("/adminpanel/feature-gallery", data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteGallery = (id: string) => api.delete(`/adminpanel/feature-gallery/${id}`);

// Brands
export const getBrands = () => api.get("/feature-brands");
export const createBrand = (data: FormData) =>
  api.post("/adminpanel/feature-brands", data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteBrand = (id: string) => api.delete(`/adminpanel/feature-brands/${id}`);

// Discounts
export const getDiscounts = () => api.get("/adminpanel/discount-coupons");
export const createDiscount = (data: object) => api.post("/adminpanel/discount-coupon", data);
export const deleteDiscount = (id: string) => api.delete(`/adminpanel/discount-coupon/${id}`);

// Creators
export const createCreator = (data: FormData) =>
  api.post("/adminpanel/creator", data, { headers: { "Content-Type": "multipart/form-data" } });
export const updateCreator = (id: string, data: FormData) =>
  api.put(`/adminpanel/creator/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteCreator = (id: string) => api.delete(`/adminpanel/creator/${id}`);

// Authors
export const createAuthor = (data: FormData) =>
  api.post("/adminpanel/author", data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteAuthor = (id: string) => api.delete(`/adminpanel/author/${id}`);

// Events
export const getEvents = (page = 1, limit = 50) => api.get(`/adminpanel/events?page=${page}&limit=${limit}`);
export const getEvent = (id: string) => api.get(`/events/${id}`);
export const createEvent = (data: FormData) =>
  api.post("/adminpanel/events", data, { headers: { "Content-Type": "multipart/form-data" } });
export const updateEvent = (id: string, data: FormData) =>
  api.put(`/adminpanel/events/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteEvent = (id: string) => api.delete(`/adminpanel/events/${id}`);

// Analytics
export const getVideoAnalytics = () => api.get("/adminpanel/video-analytics");

// Referral Program Settings
export const getReferralSettings = () => api.get("/referral/settings");
export const updateReferralSettings = (data: { discountPercent: number; earningsPercent: number }) =>
  api.put("/adminpanel/referral-settings", data);
export const getPayoutRequests = () => api.get("/adminpanel/payout-requests");
export const updatePayoutRequest = (id: string, data: { status: string; note?: string }) =>
  api.patch(`/adminpanel/payout-requests/${id}`, data);
