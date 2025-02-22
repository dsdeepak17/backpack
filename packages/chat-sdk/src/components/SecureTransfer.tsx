import { useEffect, useState } from "react";
import {
  BACKEND_API_URL,
  Blockchain,
  walletAddressDisplay,
} from "@coral-xyz/common";
import {
  List,
  ListItem,
  MaxLabel,
  PrimaryButton,
  TextFieldLabel,
  TextInput,
  toast,
} from "@coral-xyz/react-common";
import {
  blockchainTokenData,
  useActiveSolanaWallet,
  useAnchorContext,
  useBackgroundClient,
  useLoader,
} from "@coral-xyz/recoil";
import { useCustomTheme } from "@coral-xyz/themes";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckIcon from "@mui/icons-material/Check";
import { IconButton } from "@mui/material";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { createEscrow } from "../utils/secure-transfer/secureTransfer";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 320,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};
export const SecureTransfer = ({
  remoteUserId,
  onTxFinalized,
  buttonStyle,
}: {
  remoteUserId: string;
  onTxFinalized: any;
  buttonStyle: any;
}) => {
  const [modal, setModal] = useState(false);
  const { provider, connection } = useAnchorContext();
  const background = useBackgroundClient();
  const { publicKey } = useActiveSolanaWallet();
  const [publicKeysLoading, setPublicKeysLoading] = useState(true);
  const [publicKeys, setPublicKeys] = useState<string[]>([]);
  const [selectedPublicKey, setSelectedPublickey] = useState("");
  const [amount, setAmount] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [token] = useLoader(
    blockchainTokenData({
      publicKey,
      blockchain: Blockchain.SOLANA,
      tokenAddress: publicKey,
    }),
    null
  );

  const theme = useCustomTheme();
  const refreshUserPubkeys = async () => {
    setPublicKeysLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_API_URL}/users/userById?remoteUserId=${remoteUserId}`
      );
      const data = await res.json();
      setPublicKeys(
        data.user.publicKeys
          .filter((x) => x.blockchain === Blockchain.SOLANA)
          .map((x) => x.publicKey)
      );
    } catch (e) {
      console.error(e);
    }
    setPublicKeysLoading(false);
  };

  useEffect(() => {
    if (modal) {
      refreshUserPubkeys();
    }
  }, [modal]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <IconButton
        size={"small"}
        sx={{
          color: theme.custom.colors.icon,
          "&:hover": {
            background: `${theme.custom.colors.avatarIconBackground} !important`,
          },
          cursor: "no-drop",
        }}
        style={buttonStyle}
      >
        <AttachMoneyIcon
          style={{ fontSize: 20 }}
          // onClick={() => setModal(true)}
        />
      </IconButton>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={modal}
        onClose={() => setModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Box
          sx={style}
          style={{
            background: theme.custom.colors.background,
            color: theme.custom.colors.fontColor,
          }}
        >
          <Typography id="transition-modal-title" variant="h6" component="h2">
            Secure transfer
          </Typography>

          <br />
          <TextFieldLabel
            leftLabel={"Amount"}
            rightLabel={`${token?.displayBalance} ${token?.ticker}`}
            rightLabelComponent={
              <MaxLabel
                amount={token?.nativeBalance || null}
                onSetAmount={(x) =>
                  setAmount(
                    (parseInt(x.toString()) / LAMPORTS_PER_SOL).toString()
                  )
                }
                decimals={token?.decimals || 0}
              />
            }
          />
          <div>
            <TextInput
              margin={"none"}
              value={amount}
              setValue={(e) => setAmount(e.target.value)}
            />
          </div>

          <Typography
            id="transition-modal-title"
            variant="subtitle2"
            style={{ marginBottom: 4, marginTop: 5 }}
          >
            Select public key
          </Typography>
          <List style={{ marginLeft: 0, marginRight: 0 }}>
            {publicKeys?.map((pKey, index) => (
              <ListItem
                onClick={() => setSelectedPublickey(pKey)}
                style={{ height: "48px", display: "flex", width: "100%" }}
                isFirst={index === 0}
                isLast={index === publicKeys.length - 1}
                button
                key={publicKey.toString()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div>{walletAddressDisplay(pKey)}</div>
                  <div>{selectedPublicKey === pKey && <CheckIcon />}</div>
                </div>
              </ListItem>
            ))}
          </List>
          <br />
          <PrimaryButton
            label={
              submitting ? "Sending Secure transfer..." : "Secure transfer SOL"
            }
            disabled={publicKeysLoading || !selectedPublicKey || submitting}
            onClick={async () => {
              if (
                !selectedPublicKey ||
                !publicKeys.includes(selectedPublicKey) ||
                !amount
              ) {
                return;
              }
              setSubmitting(true);
              try {
                const { signature, counter, escrow } = await createEscrow(
                  provider,
                  background,
                  connection,
                  // @ts-ignore
                  amount,
                  new PublicKey(publicKey),
                  new PublicKey(selectedPublicKey)
                );
                onTxFinalized({
                  signature,
                  counter,
                  escrow,
                });
                toast.success("", `Created secure transfer for ${amount} SOL`);
              } catch (e) {
                console.error(e);
              }
              setSubmitting(false);
              setModal(false);
            }}
          />
        </Box>
      </Modal>
    </div>
  );
};
