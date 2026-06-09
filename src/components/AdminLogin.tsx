import { FormEvent, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  ADMIN_CORRECT_IMAGE,
  ADMIN_IMAGE_OPTIONS,
  ADMIN_USERNAME,
} from "@/lib/adminLoginClient";

type LoginStep = "username" | "image" | "password";

type AdminLoginProps = {
  onAuthenticated: () => void;
};

function shuffleImages(images: readonly string[]): string[] {
  const copy = [...images];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [step, setStep] = useState<LoginStep>("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const imageOptions = useMemo(() => shuffleImages(ADMIN_IMAGE_OPTIONS), []);

  function resetToLogin(message?: string) {
    setStep("username");
    setUsername("");
    setPassword("");
    setError(message ?? "");
  }

  function handleUsernameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (username.trim() !== ADMIN_USERNAME) {
      setError("Invalid username.");
      return;
    }

    setStep("image");
  }

  function handleImageSelect(image: string) {
    setError("");

    if (image !== ADMIN_CORRECT_IMAGE) {
      resetToLogin("Incorrect image selection. Please sign in again.");
      return;
    }

    setStep("password");
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          image: ADMIN_CORRECT_IMAGE,
          password,
        }),
      });

      if (!response.ok) {
        resetToLogin("Invalid password. Please sign in again.");
        return;
      }

      onAuthenticated();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Admin Sign In
        </Typography>
        <Typography color="text.secondary">
          {step === "username" && "Enter your username to continue."}
          {step === "image" && "Select the correct verification image."}
          {step === "password" && "Enter your password to access the admin panel."}
        </Typography>
      </Box>

      {step === "username" && (
        <Box
          component="form"
          onSubmit={handleUsernameSubmit}
          sx={{ display: "grid", gap: 2 }}
        >
          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            fullWidth
            required
          />
          <Button type="submit" variant="contained">
            Continue
          </Button>
        </Box>
      )}

      {step === "image" && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          {imageOptions.map((image) => (
            <Card key={image} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardActionArea onClick={() => handleImageSelect(image)}>
                <CardMedia
                  component="img"
                  image={`/images/assets/${image}`}
                  alt="Verification option"
                  sx={{ height: 180, objectFit: "cover" }}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Select this image
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
          <Button
            variant="text"
            onClick={() => resetToLogin()}
            sx={{ gridColumn: "1 / -1" }}
          >
            Back to username
          </Button>
        </Box>
      )}

      {step === "password" && (
        <Box
          component="form"
          onSubmit={(event) => {
            handlePasswordSubmit(event).catch(() => {
              setError("Unable to sign in. Please try again.");
            });
          }}
          sx={{ display: "grid", gap: 2 }}
        >
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            fullWidth
            required
          />
          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setStep("image");
                setPassword("");
                setError("");
              }}
            >
              Back
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
