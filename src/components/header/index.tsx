import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import { Layout as AntdLayout, Avatar, Space, Switch, theme, Typography, Badge } from "antd";
import { Link } from "react-router-dom";
import { usingSupabase, sbSubscribePushes, sbSubscribePushesUpdate, sbSubscribePrices } from "../../supabaseApi";
import React, { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({ sticky = true }) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const [pushBadge, setPushBadge] = React.useState(0);
  const [poolBadge, setPoolBadge] = React.useState(0);

  React.useEffect(() => {
    if (!usingSupabase || !user?.id) return;
    const unsubInsert = sbSubscribePushes(user.id, () => setPushBadge((c) => c + 1));
    const unsubUpdate = sbSubscribePushesUpdate(user.id, () => setPushBadge((c) => c + 1));
    const unsubPrices = sbSubscribePrices(() => setPoolBadge((c) => c + 1));
    return () => {
      unsubInsert();
      unsubUpdate();
      unsubPrices();
    };
  }, [user?.id]);

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        <Space style={{ marginLeft: "8px" }} size="middle">
          {user?.name && <Text strong>{user.name}</Text>}
          {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
          <Badge count={poolBadge} offset={[6, 0]}>
            <Link to="/pool">共享池</Link>
          </Badge>
          <Badge count={pushBadge} offset={[6, 0]}>
            <Link to="/pushes">推送中心</Link>
          </Badge>
        </Space>
      </Space>
    </AntdLayout.Header>
  );
};
