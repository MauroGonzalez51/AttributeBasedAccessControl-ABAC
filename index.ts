type Role = "user" | "moderator" | "admin";
type Action = "view" | "create" | "delete" | "update";

interface Post {
    id: string;
    title: string;
    description: string;
    userId: string;
}

interface Comment {
    title: string;
    description: string;
    userId: string;
    comments: Comment[];
}

interface User {
    id: string;
    email: string;
    roles: Role[];
}

type CheckPermission<K extends keyof PermissionsWithModels> =
    | boolean
    | ((user: User, data: PermissionsWithModels[K]["dataType"]) => boolean);

type MakePermissionsWithModels<T extends Record<string, unknown>> = {
    [K in keyof T]: {
        dataType: T[K];
        action: Action;
    };
};

type Models = {
    post: Post;
    comment: Comment;
};

type PermissionsWithModels = MakePermissionsWithModels<Models>;

type PermissionsWithRoles = {
    [R in Role]: Partial<{
        [K in keyof PermissionsWithModels]: Partial<{
            [Action in PermissionsWithModels[K]["action"]]: CheckPermission<K>;
        }>;
    }>;
};

const ROLES = {
    user: {
        post: {
            view: true,
            create: true,
            update: (user, post) => user.id === post.userId,
            delete: (user, post) => user.id === post.userId,
        },
    },
    moderator: {},
    admin: {},
} as const satisfies PermissionsWithRoles;

function hasPermission<
    Model extends keyof PermissionsWithModels,
    SelectedAction extends PermissionsWithModels[Model]["action"],
>(
    model: Model,
    action: SelectedAction,
    user: User,
    data: PermissionsWithModels[Model]["dataType"],
) {
    return user.roles.some((role) => {
        const permission = (ROLES as PermissionsWithRoles)[role][model]?.[
            action
        ];

        if (!permission) return false;

        if (typeof permission === "boolean") return permission;

        return data != null && permission(user, data);
    });
}

const user: User = {
    id: "1",
    email: "email@example.com",
    roles: ["user"],
};

const post: Post = {
    id: "1",
    title: "Lorem Ipsum",
    description: "Lorem Ipsum",
    userId: "2",
};

console.log(hasPermission("post", "delete", user, post));
