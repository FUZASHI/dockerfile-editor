FROM ubuntu:22.04
RUN apt-get update && apt-get install -y openvpn iptables
COPY vpn-config.ovpn /etc/openvpn/client.conf
CMD ["openvpn", "--config", "/etc/openvpn/client.conf"]