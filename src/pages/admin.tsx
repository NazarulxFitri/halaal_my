import Head from "next/head";
import { FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GetServerSideProps } from "next";

import AdminLogin from "@/components/AdminLogin";
import { categoryLabel } from "@/lib/keywordLabels";
import { getKeywordLists } from "@/lib/keywordStore";
import type { KeywordCategory, KeywordLists } from "@/lib/types";

type AdminPageProps = {
  initialKeywordLists: KeywordLists;
  isAuthenticated: boolean;
  configError?: string;
};

type PendingMove = {
  keyword: string;
  targetCategory: KeywordCategory;
  existingCategory: KeywordCategory;
};

const EMPTY_LISTS: KeywordLists = { haram: [], syubhah: [] };

type KeywordSectionProps = {
  category: KeywordCategory;
  keywords: string[];
  newKeyword: string;
  onNewKeywordChange: (value: string) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (keyword: string) => void;
};

function KeywordSection({
  category,
  keywords,
  newKeyword,
  onNewKeywordChange,
  onAdd,
  onDelete,
}: KeywordSectionProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {categoryLabel(category)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage {categoryLabel(category).toLowerCase()} keywords.
          </Typography>
        </Box>

        <Box component="form" onSubmit={onAdd} sx={{ display: "grid", gap: 1.5 }}>
          <TextField
            label={`Add ${categoryLabel(category).toLowerCase()} keyword`}
            value={newKeyword}
            onChange={(event) => onNewKeywordChange(event.target.value)}
            placeholder="e.g. mirin"
            fullWidth
            size="small"
          />
          <Button type="submit" variant="contained" size="small">
            Add to {categoryLabel(category)}
          </Button>
        </Box>

        <List disablePadding dense>
          {keywords.length === 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="No keywords yet"
                secondary={`Add your first ${categoryLabel(category).toLowerCase()} keyword above.`}
              />
            </ListItem>
          )}
          {keywords.map((keyword, index) => (
            <ListItem
              key={keyword}
              divider={index < keywords.length - 1}
              sx={{ px: 0 }}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`delete ${keyword}`}
                  color="error"
                  size="small"
                  onClick={() => onDelete(keyword)}
                >
                  X
                </IconButton>
              }
            >
              <ListItemText primary={keyword} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}

export default function AdminPage({
  initialKeywordLists,
  isAuthenticated: initialAuthenticated,
  configError,
}: AdminPageProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [keywordLists, setKeywordLists] = useState<KeywordLists>(initialKeywordLists);
  const [newHaramKeyword, setNewHaramKeyword] = useState("");
  const [newSyubhahKeyword, setNewSyubhahKeyword] = useState("");
  const [error, setError] = useState("");
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);

  async function fetchKeywordLists(): Promise<KeywordLists | null> {
    const response = await fetch("/api/keywords");
    const data = (await response.json()) as KeywordLists & { error?: string };
    setKeywordLists({ haram: data.haram, syubhah: data.syubhah });
    return { haram: data.haram, syubhah: data.syubhah };
  }

  async function submitKeyword(
    rawKeyword: string,
    category: KeywordCategory,
    move = false,
  ): Promise<boolean> {
    const response = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: rawKeyword, category, move }),
    });

    const data = (await response.json()) as KeywordLists & {
      error?: string;
      conflict?: PendingMove;
    };

    if (response.status === 401) {
      setAuthenticated(false);
      setKeywordLists(EMPTY_LISTS);
      setError("Session expired. Please sign in again.");
      return false;
    }

    if (response.status === 409 && data.conflict) {
      setPendingMove({
        keyword: data.conflict.keyword,
        targetCategory: category,
        existingCategory: data.conflict.existingCategory,
      });
      setKeywordLists({ haram: data.haram, syubhah: data.syubhah });
      return false;
    }

    if (!response.ok) {
      setError(data.error ?? "Failed to add keyword.");
      return false;
    }

    setKeywordLists({ haram: data.haram, syubhah: data.syubhah });
    return true;
  }

  async function handleAdd(
    event: FormEvent<HTMLFormElement>,
    category: KeywordCategory,
    keyword: string,
    clearInput: () => void,
  ) {
    event.preventDefault();
    setError("");

    try {
      const added = await submitKeyword(keyword, category);
      if (added) {
        clearInput();
      }
    } catch {
      setError("Failed to add keyword.");
    }
  }

  async function handleConfirmMove() {
    if (!pendingMove) {
      return;
    }

    setMoveLoading(true);
    setError("");

    try {
      const added = await submitKeyword(
        pendingMove.keyword,
        pendingMove.targetCategory,
        true,
      );

      if (added) {
        if (pendingMove.targetCategory === "haram") {
          setNewHaramKeyword("");
        } else {
          setNewSyubhahKeyword("");
        }
        setPendingMove(null);
      }
    } catch {
      setError("Failed to move keyword.");
    } finally {
      setMoveLoading(false);
    }
  }

  async function handleLogout() {
    setError("");
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setAuthenticated(false);
      setKeywordLists(EMPTY_LISTS);
      setPendingMove(null);
    } catch {
      setError("Failed to sign out.");
    }
  }

  async function handleDelete(keyword: string, category: KeywordCategory) {
    setError("");
    try {
      const response = await fetch("/api/keywords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, category }),
      });
      if (response.status === 401) {
        setAuthenticated(false);
        setKeywordLists(EMPTY_LISTS);
        setError("Session expired. Please sign in again.");
        return;
      }
      const data = (await response.json()) as KeywordLists;
      setKeywordLists({ haram: data.haram, syubhah: data.syubhah });
    } catch {
      setError("Failed to delete keyword.");
    }
  }

  return (
    <>
      <Head>
        <title>Admin Mapping | Halal Food Checker</title>
      </Head>
      <Box
        sx={{
          minHeight: "100vh",
          py: 6,
          px: 2,
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.5)} 0%, ${theme.palette.common.white} 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={3}>
                {configError ? (
                  <Alert severity="error">{configError}</Alert>
                ) : !authenticated ? (
                  <AdminLogin
                    onAuthenticated={() => {
                      setAuthenticated(true);
                      fetchKeywordLists().catch(() => {
                        setError("Signed in, but failed to load keywords.");
                      });
                    }}
                  />
                ) : (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
                          Admin Keyword Mapping
                        </Typography>
                        <Typography color="text.secondary">
                          Each keyword can only belong to one list. Adding a duplicate
                          in the other list will prompt you to move it.
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => {
                          handleLogout().catch(() => {
                            setError("Failed to sign out.");
                          });
                        }}
                      >
                        Sign Out
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gap: 3,
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      }}
                    >
                      <KeywordSection
                        category="haram"
                        keywords={keywordLists.haram}
                        newKeyword={newHaramKeyword}
                        onNewKeywordChange={setNewHaramKeyword}
                        onAdd={(event) => {
                          handleAdd(event, "haram", newHaramKeyword, () => {
                            setNewHaramKeyword("");
                          }).catch(() => {
                            setError("Failed to add keyword.");
                          });
                        }}
                        onDelete={(keyword) => {
                          handleDelete(keyword, "haram").catch(() => {
                            setError("Failed to delete keyword.");
                          });
                        }}
                      />
                      <KeywordSection
                        category="syubhah"
                        keywords={keywordLists.syubhah}
                        newKeyword={newSyubhahKeyword}
                        onNewKeywordChange={setNewSyubhahKeyword}
                        onAdd={(event) => {
                          handleAdd(event, "syubhah", newSyubhahKeyword, () => {
                            setNewSyubhahKeyword("");
                          }).catch(() => {
                            setError("Failed to add keyword.");
                          });
                        }}
                        onDelete={(keyword) => {
                          handleDelete(keyword, "syubhah").catch(() => {
                            setError("Failed to delete keyword.");
                          });
                        }}
                      />
                    </Box>
                  </>
                )}

                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Dialog
        open={pendingMove !== null}
        onClose={() => {
          if (!moveLoading) {
            setPendingMove(null);
          }
        }}
      >
        <DialogTitle>Move keyword?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingMove && (
              <>
                &quot;{pendingMove.keyword}&quot; is already in{" "}
                <strong>{categoryLabel(pendingMove.existingCategory)}</strong>.
                Move it to <strong>{categoryLabel(pendingMove.targetCategory)}</strong>?
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPendingMove(null)}
            disabled={moveLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleConfirmMove().catch(() => {
                setError("Failed to move keyword.");
              });
            }}
            variant="contained"
            disabled={moveLoading}
          >
            {moveLoading ? "Moving..." : "Move keyword"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async (
  context,
) => {
  const { isAdminAuthenticated } = await import("@/lib/adminAuth");
  const { getFirebaseConfigError, isFirebaseConfigured } = await import(
    "@/lib/firebaseAdmin"
  );
  const authenticated = isAdminAuthenticated(context.req);

  if (!isFirebaseConfigured()) {
    return {
      props: {
        initialKeywordLists: EMPTY_LISTS,
        isAuthenticated: false,
        configError: getFirebaseConfigError(),
      },
    };
  }

  if (!authenticated) {
    return { props: { initialKeywordLists: EMPTY_LISTS, isAuthenticated: false } };
  }

  const initialKeywordLists = await getKeywordLists();
  return { props: { initialKeywordLists, isAuthenticated: true } };
};
