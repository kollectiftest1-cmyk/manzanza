/**
 * Library Redux Slice
 * Gère la bibliothèque et les emprunts
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { libraryAPI } from '../../services/api';

// Async thunks
export const fetchBooks = createAsyncThunk(
  'library/fetchBooks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.getBooks(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des livres');
    }
  }
);

export const fetchBookById = createAsyncThunk(
  'library/fetchBookById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.getBookById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement du livre');
    }
  }
);

export const createBook = createAsyncThunk(
  'library/createBook',
  async (data, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.createBook(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la création du livre');
    }
  }
);

export const updateBook = createAsyncThunk(
  'library/updateBook',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.updateBook(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la mise à jour du livre');
    }
  }
);

export const deleteBook = createAsyncThunk(
  'library/deleteBook',
  async (id, { rejectWithValue }) => {
    try {
      await libraryAPI.deleteBook(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de la suppression du livre');
    }
  }
);

export const fetchBorrowings = createAsyncThunk(
  'library/fetchBorrowings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.getLoans(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement des emprunts');
    }
  }
);

export const fetchMyBorrowings = createAsyncThunk(
  'library/fetchMyBorrowings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.getMyLoans();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du chargement de vos emprunts');
    }
  }
);

export const borrowBook = createAsyncThunk(
  'library/borrowBook',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.borrowBook(bookId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors de l\'emprunt du livre');
    }
  }
);

export const returnBook = createAsyncThunk(
  'library/returnBook',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await libraryAPI.returnBook(loanId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Erreur lors du retour du livre');
    }
  }
);

const librarySlice = createSlice({
  name: 'library',
  initialState: {
    books: { results: [], count: 0, next: null, previous: null },
    currentBook: null,
    borrowings: [],
    myBorrowings: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBook: (state) => {
      state.currentBook = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch books
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch book by ID
      .addCase(fetchBookById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBook = action.payload;
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create book
      .addCase(createBook.fulfilled, (state, action) => {
        state.books.results.unshift(action.payload);
        state.books.count += 1;
      })

      // Update book
      .addCase(updateBook.fulfilled, (state, action) => {
        const index = state.books.results.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.books.results[index] = action.payload;
        }
        if (state.currentBook?.id === action.payload.id) {
          state.currentBook = action.payload;
        }
      })

      // Delete book
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.books.results = state.books.results.filter((b) => b.id !== action.payload);
        state.books.count -= 1;
      })

      // Fetch borrowings
      .addCase(fetchBorrowings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBorrowings.fulfilled, (state, action) => {
        state.loading = false;
        state.borrowings = action.payload;
      })
      .addCase(fetchBorrowings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch my borrowings
      .addCase(fetchMyBorrowings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBorrowings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBorrowings = action.payload;
      })
      .addCase(fetchMyBorrowings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Borrow book
      .addCase(borrowBook.fulfilled, (state, action) => {
        state.myBorrowings.unshift(action.payload);
        // Update book availability
        const book = state.books.results.find((b) => b.id === action.payload.book);
        if (book) {
          book.available_copies = Math.max(0, (book.available_copies || 0) - 1);
        }
      })

      // Return book
      .addCase(returnBook.fulfilled, (state, action) => {
        const index = state.myBorrowings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.myBorrowings[index] = action.payload;
        }
        // Update book availability
        const book = state.books.results.find((b) => b.id === action.payload.book);
        if (book) {
          book.available_copies = (book.available_copies || 0) + 1;
        }
      });
  },
});

export const { clearError, clearCurrentBook } = librarySlice.actions;
export default librarySlice.reducer;
