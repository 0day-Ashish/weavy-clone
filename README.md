# 🌊 Weavy Clone

A powerful, node-based workflow builder for AI-powered content generation. Chain together LLMs, image processing, and video analysis tools on an infinite canvas.

![Weavy Clone Screenshot](/public/og-image.png)

## ✨ Features

- **🎨 Infinite Canvas**: Drag-and-drop interface powered by React Flow.
- **🤖 Multimodal AI**:
  - **Text Generation**: Google Gemini 1.5 Pro & Flash integration.
  - **Image Analysis**: Feed images directly into LLM prompts.
  - **Smart Cropping**: Intelligent image resizing with `sharp`.
  - **Video Extraction**: extract specific frames from video URLs using `ffmpeg`.
- **🔗 Smart Wiring**: Connect nodes logically (e.g., Image -> Crop -> LLM).
- **💾 Persistence**:
  - **Save/Load**: Store workflows in a PostgreSQL database via Prisma.
  - **History**: Track every execution step, success, and failure in real-time.
  - **Templates**: One-click setups for common tasks (e.g., "Marketing Kit Generator").
- **⚡ Real-time Updates**: Live execution status with polling and animated loading states.
- **🔐 Secure**: Authentication via Clerk.
- **🌗 Dark Mode**: sleek, professional UI with custom Tailwind styling.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: Shadcn/ui + Tailwind CSS
- **State Management**: Zustand + Zundo (Undo/Redo)
- **Canvas Engine**: React Flow (xyflow)
- **Backend**: Trigger.dev (Serverless Tasks)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk
- **Validation**: Zod

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL Database (e.g., Supabase, Neon)
- Clerk Account
- Trigger.dev Account
- Google Gemini API Key

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/weavy-clone.git
    cd weavy-clone
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**

    Create a `.env` file in the root directory:

    ```env
    # Database
    DATABASE_URL="postgresql://..."

    # Auth (Clerk)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
    CLERK_SECRET_KEY="sk_test_..."

    # AI (Gemini)
    GEMINI_API_KEY="AIza..."

    # Trigger.dev
    TRIGGER_SECRET_KEY="tr_..."
    ```

4.  **Initialize Database:**

    ```bash
    npx prisma db push
    npx prisma generate
    ```

5.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

6.  **Run Trigger.dev (in a separate terminal):**

    ```bash
    npx trigger.dev@latest dev
    ```

## 🎮 Usage

1.  **Add Nodes**: Drag nodes from the left sidebar onto the canvas.
2.  **Connect**: Draw lines between handles (e.g., connect an Image Node to a Crop Node).
3.  **Configure**: Click nodes to set properties (Prompts, Model, Crop Dimensions).
4.  **Run**: Click the "Run" button on processing nodes (LLM, Crop, Extract).
5.  **Save**: Click "Save" in the top bar to persist your workflow.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
