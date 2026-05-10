/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  image: string;
  ingredients: string[];
  instructions: string;
  authorId: string;
  createdAt: any;
}

export interface ChatMessage {
  id?: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: any;
}

export interface Favorite {
  id?: string;
  userId: string;
  recipeId: string;
  createdAt: any;
}
