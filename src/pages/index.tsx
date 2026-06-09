import Head from "next/head";
import type { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, MouseEvent, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { classifyInput } from "@/lib/classify";
import type { HalalCheckResult, KeywordLists } from "@/lib/types";

const DISCLAIMER =
  "This result is generated based on available data and ingredient analysis. It is not a certified halal verification. Please refer to official authorities for confirmation.";

function resultLabel(status: HalalCheckResult["status"]): string {
  if (status === "non_halal") return "Haram";
  if (status === "doubtful") return "Syubhah";
  if (status === "halal") return "Halal";
  return "Unknown";
}

type CheckMode = "text" | "image";

type HomePageProps = {
  initialKeywordLists: KeywordLists;
};

export default function HomePage({ initialKeywordLists }: HomePageProps) {
  const [checkMode, setCheckMode] = useState<CheckMode>("text");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<HalalCheckResult | null>(null);
  const [keywordLists] = useState<KeywordLists>(initialKeywordLists);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const previousPreviewUrlRef = useRef<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(classifyInput(query, keywordLists));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImage(file);
    setOcrError("");
    if (previousPreviewUrlRef.current) {
      URL.revokeObjectURL(previousPreviewUrlRef.current);
      previousPreviewUrlRef.current = null;
    }
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl);
      previousPreviewUrlRef.current = objectUrl;
      return;
    }
    setImagePreviewUrl("");
  }

  function handleCheckModeChange(
    _event: MouseEvent<HTMLElement>,
    nextMode: CheckMode | null,
  ) {
    if (!nextMode) {
      return;
    }
    setCheckMode(nextMode);
    setResult(null);
    setOcrError("");
  }

  async function handleScanImage() {
    if (!selectedImage) {
      setOcrError("Please upload an image first.");
      return;
    }

    try {
      setOcrLoading(true);
      setOcrError("");
      const { scanImageForText } = await import("@/lib/ocrScan");
      const { text } = await scanImageForText(selectedImage, keywordLists);
      setExtractedText(text);
      setResult(classifyInput(text, keywordLists, { fuzzy: true }));
    } catch {
      setOcrError(
        "OCR failed for this image. Please try a clearer label image with better lighting.",
      );
    } finally {
      setOcrLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Halal Food Checker</title>
        <meta
          name="description"
          content="Phase 2 halal checker using text and image OCR keyword mapping"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <Container maxWidth="md">
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                    gutterBottom
                  >
                    Halal Food Checker
                  </Typography>
                  <Typography color="text.secondary">
                    Check ingredients by typing a product name or scanning a
                    label image.
                  </Typography>
                </Box>

                <ToggleButtonGroup
                  value={checkMode}
                  exclusive
                  onChange={handleCheckModeChange}
                  fullWidth
                  color="primary"
                  aria-label="check mode"
                >
                  <ToggleButton value="text">Text Input</ToggleButton>
                  <ToggleButton value="image">Image Scan</ToggleButton>
                </ToggleButtonGroup>

                {checkMode === "text" ? (
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Check by Keyword
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Enter a food or product name to check against haram and
                          syubhah keywords.
                        </Typography>
                      </Box>
                      <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: "grid", gap: 2 }}
                      >
                        <TextField
                          id="query"
                          label="Food / Product Name"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="e.g. Ayam Goreng KFC"
                          fullWidth
                        />
                        <Button type="submit" variant="contained" size="large">
                          Check
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>
                ) : (
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Scan Product Label
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload a clear, well-lit label image. Stylized fonts are
                          harder to read, so results work best on standard printed
                          ingredient lists.
                        </Typography>
                      </Box>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                      >
                        <Button component="label" variant="outlined">
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                          />
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => {
                            handleScanImage().catch(() => {
                              setOcrError(
                                "OCR failed for this image. Please try a clearer label image with better lighting.",
                              );
                            });
                          }}
                          disabled={ocrLoading || !selectedImage}
                        >
                          {ocrLoading ? "Scanning..." : "Scan & Check"}
                        </Button>
                      </Stack>
                      {selectedImage && (
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Selected image: {selectedImage.name}
                          </Typography>
                          {imagePreviewUrl && (
                            <Box
                              component="img"
                              src={imagePreviewUrl}
                              alt="Uploaded label preview"
                              sx={{
                                width: "100%",
                                maxHeight: 260,
                                objectFit: "contain",
                                borderRadius: 1.5,
                                border: (theme) =>
                                  `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                                backgroundColor: "#fff",
                                p: 1,
                              }}
                            />
                          )}
                        </Stack>
                      )}
                      {ocrError && <Alert severity="error">{ocrError}</Alert>}
                      {extractedText && (
                        <TextField
                          label="Extracted OCR Text"
                          value={extractedText}
                          multiline
                          minRows={3}
                          fullWidth
                          slotProps={{ htmlInput: { readOnly: true } }}
                        />
                      )}
                    </Stack>
                  </Paper>
                )}

                {result && (
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Check Result
                        </Typography>
                        <Chip
                          label={resultLabel(result.status)}
                          color={
                            result.status === "halal"
                              ? "success"
                              : result.status === "non_halal"
                                ? "error"
                                : "warning"
                          }
                        />
                      </Box>
                      <List dense sx={{ listStyleType: "disc", pl: 3 }}>
                        {result.reasons.map((reason) => (
                          <ListItem
                            key={reason}
                            sx={{ display: "list-item", p: 0 }}
                          >
                            {reason}
                          </ListItem>
                        ))}
                      </List>
                    </Stack>
                  </Paper>
                )}

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {DISCLAIMER}
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  HomePageProps
> = async () => {
  const { getKeywordLists } = await import("@/lib/keywordStore");
  const initialKeywordLists = await getKeywordLists();
  return { props: { initialKeywordLists } };
};
